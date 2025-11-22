'use server';

import { getAdminSession } from './admin-auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleRoomStatus(roomId: string) {
  const session = await getAdminSession();
  
  if (!session) {
    return { success: false, error: 'Unauthorized: Admin session required' };
  }

  try {
    const room = await prisma.auctionRoom.findUnique({
      where: { id: roomId },
      select: { status: true, ownerId: true },
    });

    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.ownerId !== session.userId) {
      return { success: false, error: 'Forbidden: Only the room owner can change status' };
    }

    // DRAFT → OPEN (iniciar pela primeira vez)
    // OPEN → PAUSED (pausar)
    // PAUSED → OPEN (retomar)
    const newStatus = room.status === 'OPEN' ? 'PAUSED' : 'OPEN';

    await prisma.auctionRoom.update({
      where: { id: roomId },
      data: { status: newStatus },
    });

    revalidatePath(`/room/${roomId}`);
    return { success: true, status: newStatus };
  } catch (error) {
    console.error('Toggle Status Error:', error);
    return { success: false, error: 'Failed to toggle status' };
  }
}
