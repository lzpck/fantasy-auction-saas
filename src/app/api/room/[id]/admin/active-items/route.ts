import { getAdminSession } from '@/app/actions/admin-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verify admin session and ownership
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const room = await prisma.auctionRoom.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!room || room.ownerId !== session.userId) {
      return NextResponse.json({ error: 'Only room owner can access this' }, { status: 403 });
    }

    // Get all items with active bids (status NOMINATED)
    const activeItems = await prisma.auctionItem.findMany({
      where: {
        auctionRoomId: id,
        status: 'NOMINATED',
      },
      include: {
        winningBid: {
          include: {
            team: {
              select: {
                name: true,
                ownerName: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiresAt: 'asc', // Sort by expiration time (nearest first)
      },
    });

    return NextResponse.json({ activeItems });
  } catch (error) {
    console.error('Error fetching admin active items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
