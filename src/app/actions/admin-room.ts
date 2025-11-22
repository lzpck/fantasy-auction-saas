'use server';

import { prisma } from '@/lib/prisma';
import { getAdminSession } from './admin-auth';
import { revalidatePath } from 'next/cache';
import { AuctionSettings } from '@/types/auction-settings';
import bcrypt from 'bcryptjs';

export async function verifyRoomOwnership(roomId: string) {
  const session = await getAdminSession();
  if (!session) {
    return { authorized: false, error: 'Unauthorized' };
  }

  const room = await prisma.auctionRoom.findUnique({
    where: { id: roomId },
    select: { ownerId: true },
  });

  if (!room || room.ownerId !== session.userId) {
    return { authorized: false, error: 'Forbidden' };
  }

  return { authorized: true, userId: session.userId };
}

export async function importPlayers(roomId: string, players: Array<{ name: string, position: string, nflTeam: string }>) {
  const auth = await verifyRoomOwnership(roomId);
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const data = players.map(p => ({
      auctionRoomId: roomId,
      name: p.name,
      position: p.position,
      nflTeam: p.nflTeam,
      status: 'PENDING' as const,
    }));

    await prisma.auctionItem.createMany({
      data,
    });

    revalidatePath(`/room/${roomId}/admin`);
    return { success: true };
  } catch (error) {
    console.error('Error importing players:', error);
    return { success: false, error: 'Failed to import players' };
  }
}

export async function deletePlayer(playerId: string) {
  // We need to find the room ID first to verify ownership
  const player = await prisma.auctionItem.findUnique({
    where: { id: playerId },
    select: { auctionRoomId: true }
  });

  if (!player) return { success: false, error: 'Player not found' };

  const auth = await verifyRoomOwnership(player.auctionRoomId);
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    await prisma.auctionItem.delete({
      where: { id: playerId }
    });

    revalidatePath(`/room/${player.auctionRoomId}/admin`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting player:', error);
    return { success: false, error: 'Failed to delete player' };
  }
}

export async function clearAllPlayers(roomId: string) {
  const auth = await verifyRoomOwnership(roomId);
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    await prisma.auctionItem.deleteMany({
      where: { auctionRoomId: roomId }
    });

    revalidatePath(`/room/${roomId}/admin`);
    return { success: true };
  } catch (error) {
    console.error('Error clearing players:', error);
    return { success: false, error: 'Failed to clear players' };
  }
}

export async function updateRoomSettings(roomId: string, newSettings: Partial<AuctionSettings>) {
  const auth = await verifyRoomOwnership(roomId);
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    const room = await prisma.auctionRoom.findUnique({ where: { id: roomId } });
    if (!room) return { success: false, error: 'Room not found' };

    const currentSettings = JSON.parse(room.settings) as AuctionSettings;
    const updatedSettings = { ...currentSettings, ...newSettings };

    await prisma.auctionRoom.update({
      where: { id: roomId },
      data: {
        settings: JSON.stringify(updatedSettings),
      },
    });

    revalidatePath(`/room/${roomId}/admin`);
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

export async function updateTeamStats(teamId: string, name: string, budget: number, spots: number) {
    const team = await prisma.auctionTeam.findUnique({ where: { id: teamId }, select: { auctionRoomId: true } });
    if (!team) return { success: false, error: 'Team not found' };

    const auth = await verifyRoomOwnership(team.auctionRoomId);
    if (!auth.authorized) return { success: false, error: auth.error };

    try {
        await prisma.auctionTeam.update({
            where: { id: teamId },
            data: {
                name,
                budget,
                rosterSpots: spots
            }
        });
        
        revalidatePath(`/room/${team.auctionRoomId}/admin`);
        return { success: true };
    } catch (error) {
        console.error('Error updating team stats:', error);
        return { success: false, error: 'Failed to update team stats' };
    }
}

export async function createTeam(roomId: string, name: string, budget: number, spots: number) {
  const auth = await verifyRoomOwnership(roomId);
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    await prisma.auctionTeam.create({
      data: {
        auctionRoomId: roomId,
        name,
        budget,
        rosterSpots: spots,
        // pinHash is optional and starts null (unclaimed)
      }
    });

    revalidatePath(`/room/${roomId}/admin`);
    return { success: true };
  } catch (error) {
    console.error('Error creating team:', error);
    return { success: false, error: 'Failed to create team' };
  }
}

export async function deleteRoom(roomId: string) {
  const auth = await verifyRoomOwnership(roomId);
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    // Use transaction for safety and atomicity
    await prisma.$transaction(async (tx) => {
      // Explicitly delete related data to ensure "cascading removal" as requested
      // Although onDelete: Cascade in schema handles this, explicit delete is safer against schema changes
      // and ensures we are aware of what we are deleting.
      
      // 1. Delete Items (cascades to bids)
      await tx.auctionItem.deleteMany({ where: { auctionRoomId: roomId } });
      
      // 2. Delete Teams (cascades to bids, notifications)
      await tx.auctionTeam.deleteMany({ where: { auctionRoomId: roomId } });
      
      // 3. Delete the Room
      await tx.auctionRoom.delete({ where: { id: roomId } });
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting room:', error);
    return { success: false, error: 'Failed to delete room' };
  }
}

export async function resetTeamPin(teamId: string) {
  const team = await prisma.auctionTeam.findUnique({
    where: { id: teamId },
    select: { auctionRoomId: true }
  });

  if (!team) return { success: false, error: 'Team not found' };

  const auth = await verifyRoomOwnership(team.auctionRoomId);
  if (!auth.authorized) return { success: false, error: auth.error };

  try {
    // Generate 4 digit PIN
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(newPin, 10);

    await prisma.auctionTeam.update({
      where: { id: teamId },
      data: { pinHash: hashedPin }
    });

    revalidatePath(`/room/${team.auctionRoomId}/admin`);
    return { success: true, newPin };
  } catch (error) {
    console.error('Error resetting team PIN:', error);
    return { success: false, error: 'Failed to reset PIN' };
  }
}
