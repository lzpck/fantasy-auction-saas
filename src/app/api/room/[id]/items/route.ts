import { getTeamSession } from '@/app/actions/auth';
import { getAdminSession } from '@/app/actions/admin-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const teamSession = await getTeamSession();
  let isAdmin = false;

  if (!teamSession || teamSession.roomId !== id) {
    // Check for admin session
    const adminSession = await getAdminSession();
    if (adminSession) {
        // Verify if admin owns the room
        const room = await prisma.auctionRoom.findUnique({
            where: { id },
            select: { ownerId: true }
        });
        if (room && room.ownerId === adminSession.userId) {
            isAdmin = true;
        }
    }

    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search') || '';
  const position = searchParams.get('position') || 'ALL';
  const status = searchParams.get('status') || 'ALL'; // ALL, AVAILABLE (PENDING), SOLD, NOMINATED

  const skip = (page - 1) * limit;

  const where: Prisma.AuctionItemWhereInput = {
    auctionRoomId: id,
  };

  if (search) {
    where.name = { contains: search }; // SQLite is case-insensitive by default for contains usually, or we might need mode: 'insensitive' if using Postgres
  }

  if (position !== 'ALL') {
    where.position = position;
  }

  if (status === 'AVAILABLE') {
    where.status = 'PENDING';
  } else if (status !== 'ALL') {
    where.status = status as import('@prisma/client').PlayerStatus;
  }

  try {
    const [items, total] = await Promise.all([
      prisma.auctionItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          winningBid: {
            include: {
              team: {
                select: {
                  name: true,
                  ownerName: true,
                }
              }
            }
          },
        },
        orderBy: [
            { status: 'asc' }, // NOMINATED < PENDING < SOLD (alphabetical order of enum strings might not be ideal, but let's see)
            // Actually, we want NOMINATED first.
            // Prisma doesn't support custom sort order easily without raw query.
            // For now, let's sort by name, and the frontend handles the "Nominated" visual priority if they are in the list.
            // OR we can rely on the status filter.
            { name: 'asc' }
        ]
      }),
      prisma.auctionItem.count({ where }),
    ]);

    // Custom sort to put NOMINATED first if they appear in this page (unlikely if we filter by status, but good for ALL)
    const sortedItems = [...items].sort((a, b) => {
        if (a.status === 'NOMINATED' && b.status !== 'NOMINATED') return -1;
        if (a.status !== 'NOMINATED' && b.status === 'NOMINATED') return 1;
        return 0; // Keep original sort (name)
    });

    return NextResponse.json({
      items: sortedItems,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Items Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
