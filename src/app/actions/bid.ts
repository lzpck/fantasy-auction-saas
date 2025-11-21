'use server';

import { getTeamSession } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { formatToMillions } from '@/lib/format-millions';

type BidResult = { success: true } | { success: false; error: string };

export async function placeBid(
  roomId: string,
  playerId: string,
  amount: number,
  contractYears: number
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

      // Parse settings
      let timerSeconds = 43200; // Default 12 hours
      let minIncrement = 1000000; // Default 1M
      let contractLogic = { enabled: false, rules: [] as any[] };

      try {
        const settings = JSON.parse(room.settings);
        if (settings.timerSeconds) timerSeconds = Number(settings.timerSeconds);
        if (settings.minIncrement) minIncrement = Number(settings.minIncrement);
        if (settings.contractLogic) contractLogic = settings.contractLogic;
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

      // Increment logic: If minIncrement is < 1 (e.g. 0.15 for 15%), treat as percentage.
      // If >= 1, treat as fixed amount (in millions).
      let minBid = 1000000; // Default 1M
      if (currentHighBid > 0) {
        if (minIncrement < 1) {
           // Percentage-based increment
           minBid = Math.ceil(currentHighBid * (1 + minIncrement));
        } else {
           // Fixed amount increment (already in millions)
           minBid = currentHighBid + minIncrement;
        }
      }

      if (amount < minBid) {
        throw new Error(`O lance mínimo é ${formatToMillions(minBid)} (Atual: ${formatToMillions(currentHighBid)})`);
      }

      // D. Validate Contract Logic
      if (contractLogic.enabled && contractLogic.rules.length > 0) {
        const rule = contractLogic.rules.find((r: any) =>
          amount >= r.minBid && (!r.maxBid || amount <= r.maxBid)
        );

        if (!rule) {
           // Fallback: if no rule matches (e.g. bid too high for defined rules), use the highest rule
           const maxRule = contractLogic.rules.sort((a: any, b: any) => b.minBid - a.minBid)[0];
           if (amount > maxRule.minBid) {
             // Validate against the highest rule
             const isValid = validateContractRule(maxRule, contractYears);
             if (!isValid.valid) {
                throw new Error(isValid.message || 'Contrato inválido');
             }
           } else {
             throw new Error(`Não foi encontrada regra de contrato para o valor ${formatToMillions(amount)}.`);
           }
        } else {
          // Validate against the matched rule
          const isValid = validateContractRule(rule, contractYears);
          if (!isValid.valid) {
            throw new Error(isValid.message || 'Contrato inválido');
          }
        }
      }

      // Helper function to validate contract years based on rule type
      function validateContractRule(rule: any, years: number): { valid: boolean; message?: string } {
        const rangeText = `${formatToMillions(rule.minBid)} - ${rule.maxBid ? formatToMillions(rule.maxBid) : '∞'}`;

        switch (rule.durationType) {
          case 'any':
            // Any duration is allowed
            return { valid: years >= 1 };

          case 'min-2':
            if (years < 2) {
              return {
                valid: false,
                message: `Para lances entre ${rangeText}, o contrato deve ter no mínimo 2 anos (você escolheu ${years} ano${years !== 1 ? 's' : ''}).`
              };
            }
            return { valid: true };

          case 'min-3':
            if (years < 3) {
              return {
                valid: false,
                message: `Para lances entre ${rangeText}, o contrato deve ter no mínimo 3 anos (você escolheu ${years} ano${years !== 1 ? 's' : ''}).`
              };
            }
            return { valid: true };

          case 'min-4':
            if (years < 4) {
              return {
                valid: false,
                message: `Para lances entre ${rangeText}, o contrato deve ter no mínimo 4 anos (você escolheu ${years} ano${years !== 1 ? 's' : ''}).`
              };
            }
            return { valid: true };

          case 'fixed':
            if (years !== rule.years) {
              return {
                valid: false,
                message: `Para lances entre ${rangeText}, o contrato deve ter exatamente ${rule.years} ano${rule.years !== 1 ? 's' : ''}.`
              };
            }
            return { valid: true };

          default:
            // Legacy support: if no durationType is specified, assume fixed
            if (rule.years !== undefined && years !== rule.years) {
              return {
                valid: false,
                message: `Para lances entre ${rangeText}, o contrato deve ser de ${rule.years} ano${rule.years !== 1 ? 's' : ''}.`
              };
            }
            return { valid: true };
        }
      }

      // E. Fetch Team & Calculate Budget
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
        throw new Error(`Saldo insuficiente. Disponível: ${formatToMillions(availableBudget)} (Gasto: ${formatToMillions(spentBudget)}, Bloqueado: ${formatToMillions(lockedBudget)})`);
      }

      // F. Check Roster Spots
      const isAlreadyWinning = player.winningTeamId === teamId;
      
      const newItemsCount = wonItems.length + activeWinningItems.length + 1;
      
      if (!isAlreadyWinning && newItemsCount > team.rosterSpots) {
         throw new Error('Sem vagas no elenco.');
      }

      // G. Execute Bid
      const newBid = await tx.bid.create({
        data: {
          auctionItemId: playerId,
          teamId: teamId,
          amount: amount,
          contractYears: contractYears,
          status: 'VALID',
        },
      });

      await tx.auctionItem.update({
        where: { id: playerId },
        data: {
          status: 'NOMINATED',
          winningBidId: newBid.id,
          winningTeamId: teamId,
          contractYears: contractYears,
          expiresAt: expiresAt,
        },
      });

      // Notify previous winner
      if (player.winningTeamId && player.winningTeamId !== teamId) {
        await tx.notification.create({
          data: {
            teamId: player.winningTeamId,
            type: 'OUTBID',
            message: `Você foi superado por ${team.name} em ${player.name} ($${amount} - ${contractYears} anos)`,
            relatedItemId: playerId,
          },
        });
      }

      revalidatePath(`/room/${roomId}`);
      return { success: true };
    });

  } catch (error: any) {
    console.error('Erro ao dar lance:', error);
    const errorMessage = error?.message || 'Erro interno ao processar lance.';
    return { success: false, error: errorMessage };
  }
}
