'use server';

import { getTeamSession } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type BidResult = { success: true } | { success: false; error: string };

export async function placeBid(
  roomId: string,
  playerId: string,
  amount: number
): Promise<BidResult> {
  try {
    // 1. Validate Session
    const session = await getTeamSession();
    if (!session || session.teamId === 'admin') {
      return { success: false, error: 'Você precisa estar logado como um time para dar lances.' };
    }

    if (session.roomId !== roomId) {
      return { success: false, error: 'Sessão inválida para esta sala.' };
    }

    const teamId = session.teamId;

    // 2. Transaction for Atomicity
    return await prisma.$transaction(async (tx) => {
      // A. Fetch Room Status
      const room = await tx.auctionRoom.findUnique({
        where: { id: roomId },
        select: { status: true, settings: true },
      });

      if (!room || room.status !== 'OPEN') {
        throw new Error('O leilão não está aberto.');
      }

      // Parse settings to get timer
      let timerSeconds = 43200; // Default 12 hours
      try {
        const settings = JSON.parse(room.settings);
        if (settings.timerSeconds) {
          timerSeconds = Number(settings.timerSeconds);
        }
      } catch {
        // ignore json error, use default
      }

      const expiresAt = new Date(Date.now() + timerSeconds * 1000);

      // B. Fetch Player & Current Bid
      const player = await tx.auctionItem.findUnique({
        where: { id: playerId },
        include: { winningBid: true },
      });

      if (!player) {
        throw new Error('Jogador não encontrado.');
      }

      if (player.auctionRoomId !== roomId) {
        throw new Error('Jogador não pertence a esta sala.');
      }

      if (player.status !== 'PENDING' && player.status !== 'NOMINATED') {
        throw new Error('Este jogador não está disponível para lances.');
      }

      // C. Validate Bid Increment
      const currentHighBid = player.winningBid?.amount || 0;
      const minBid = currentHighBid === 0 ? 1 : Math.ceil(currentHighBid * 1.15); // +15% rule

      if (amount < minBid) {
        throw new Error(`O lance mínimo é $${minBid} (Atual: $${currentHighBid})`);
      }

      // D. Fetch Team & Calculate Budget
      const team = await tx.auctionTeam.findUnique({
        where: { id: teamId },
        include: {
          bids: {
            where: {
              wonItem: {
                status: 'NOMINATED',
              },
            },
            include: {
              wonItem: true,
            },
          },
        },
      });

      if (!team) {
        throw new Error('Time não encontrado.');
      }

      // Calculate Spent (Sold Items)
      const wonItems = await tx.auctionItem.findMany({
        where: {
          winningTeamId: teamId,
          status: 'SOLD',
        },
        select: {
          winningBid: {
            select: { amount: true },
          },
        },
      });

      const spentBudget = wonItems.reduce((sum, item) => sum + (item.winningBid?.amount || 0), 0);

      // Calculate Locked (Active High Bids)
      // We need to find items where this team is the CURRENT winner (winningTeamId) but status is NOMINATED.
      // AND exclude the current player we are bidding on (since we are replacing our own bid or starting new).
      const activeWinningItems = await tx.auctionItem.findMany({
        where: {
          winningTeamId: teamId,
          status: 'NOMINATED',
          id: { not: playerId }, // Exclude current player
        },
        select: {
          winningBid: {
            select: { amount: true },
          },
        },
      });

      const lockedBudget = activeWinningItems.reduce((sum, item) => sum + (item.winningBid?.amount || 0), 0);

      const availableBudget = team.budget - spentBudget - lockedBudget;

      if (amount > availableBudget) {
        throw new Error(`Saldo insuficiente. Disponível: $${availableBudget} (Gasto: $${spentBudget}, Bloqueado: $${lockedBudget})`);
      }

      // E. Check Roster Spots
      const isAlreadyWinning = player.winningTeamId === teamId;
      
      // Spots Used = Sold Items + Active Winning (Other players) + (1 if we win this one)
      // If we are already winning this one, we don't consume an EXTRA spot compared to current state, 
      // but we still need to validate against total spots.
      
      // Actually, simpler logic:
      // Count items I have WON (SOLD) + items I am WINNING (NOMINATED).
      // If I am NOT winning the current player, adding this bid will increase my count by 1.
      // If I AM winning the current player, my count stays the same.
      
      const newItemsCount = wonItems.length + activeWinningItems.length + 1;
      
      if (!isAlreadyWinning && newItemsCount > team.rosterSpots) {
         throw new Error('Sem vagas no elenco.');
      }

      // F. Execute Bid
      const newBid = await tx.bid.create({
        data: {
          auctionItemId: playerId,
          teamId: teamId,
          amount: amount,
          status: 'VALID',
        },
      });

      await tx.auctionItem.update({
        where: { id: playerId },
        data: {
          status: 'NOMINATED',
          winningBidId: newBid.id,
          winningTeamId: teamId,
          expiresAt: expiresAt,
        },
      });

      // Notify previous winner
      if (player.winningTeamId && player.winningTeamId !== teamId) {
        await tx.notification.create({
          data: {
            teamId: player.winningTeamId,
            type: 'OUTBID',
            message: `Você foi superado por ${team.name} em ${player.name} ($${amount})`,
            relatedItemId: playerId,
          },
        });
      }

      revalidatePath(`/room/${roomId}`);
      return { success: true };
    });

  } catch (error: any) {
    console.error('Erro ao dar lance:', error);
    // Return the specific error message if it's one of ours, otherwise generic
    const errorMessage = error?.message || 'Erro interno ao processar lance.';
    return { success: false, error: errorMessage };
  }
}
