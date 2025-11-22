'use server';

import { getAdminSession } from '@/app/actions/admin-auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

type RetractResult = { success: true } | { success: false; error: string };

export async function retractBid(
  roomId: string,
  itemId: string
): Promise<RetractResult> {
  try {
    // 1. Verify Admin Session & Ownership
    const session = await getAdminSession();
    if (!session) {
      return { success: false, error: 'Não autorizado.' };
    }

    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || room.ownerId !== session.userId) {
      return { success: false, error: 'Apenas o dono da sala pode retirar lances.' };
    }

    // 2. Transaction
    return await prisma.$transaction(async (tx) => {
      const item = await tx.auctionItem.findUnique({
        where: { id: itemId },
        include: { winningBid: true },
      });

      if (!item || !item.winningBidId) {
        throw new Error('Item não tem lance ativo para retirar.');
      }

      // Mark current bid as RETRACTED
      await tx.bid.update({
        where: { id: item.winningBidId },
        data: { status: 'RETRACTED' },
      });

      // Find previous valid bid
      const previousBid = await tx.bid.findFirst({
        where: {
          auctionItemId: itemId,
          status: 'VALID',
          id: { not: item.winningBidId },
        },
        orderBy: { amount: 'desc' },
      });

      if (previousBid) {
        // Restore previous winner
        // Reset timer? Usually yes, to give them a fair chance again.
        // Let's use the same logic as placeBid for timer
        let timerSeconds = 43200; // Default 12h
        try {
          const settings = JSON.parse(room.settings);
          if (settings.timerSeconds) timerSeconds = Number(settings.timerSeconds);
        } catch {
          // ignore
        }
        
        const newExpiresAt = new Date(Date.now() + timerSeconds * 1000);

        await tx.auctionItem.update({
          where: { id: itemId },
          data: {
            winningBidId: previousBid.id,
            winningTeamId: previousBid.teamId,
            expiresAt: newExpiresAt,
            status: 'NOMINATED',
          },
        });

        // TODO: Notify the restored winner when notification system is implemented
        // await tx.notification.create({
        //   data: {
        //     teamId: previousBid.teamId,
        //     type: 'WINNER_RESTORED',
        //     message: `Seu lance em ${item.name} foi restaurado após cancelamento do lance superior.`,
        //     relatedItemId: itemId,
        //   },
        // });

      } else {
        // No previous bid, reset item to PENDING
        // When there are no more bids, the item should return to the market as available
        await tx.auctionItem.update({
          where: { id: itemId },
          data: {
            winningBidId: null,
            winningTeamId: null,
            expiresAt: null,
            contractYears: null,
            status: 'PENDING',
          },
        });
      }

      revalidatePath(`/room/${roomId}`);
      return { success: true };
    });

  } catch (error: any) {
    console.error('Erro ao retirar lance:', error);
    return { success: false, error: error?.message || 'Erro interno ao retirar lance.' };
  }
}
