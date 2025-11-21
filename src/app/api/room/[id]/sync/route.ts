import { getTeamSession } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getTeamSession();

  if (!session || session.roomId !== id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const teamId = session.teamId;

  try {
    const [room, teams, activeItems, myTeam] = await Promise.all([
      prisma.auctionRoom.findUnique({
        where: { id },
        select: { status: true, settings: true },
      }),
      prisma.auctionTeam.findMany({
        where: { auctionRoomId: id },
        select: { id: true, name: true, budget: true, rosterSpots: true },
      }),
      prisma.auctionItem.findMany({
        where: { 
          auctionRoomId: id,
          status: 'NOMINATED'
        },
        include: {
          winningBid: true,
        },
      }),
      prisma.auctionTeam.findUnique({
        where: { id: teamId },
        include: {
            bids: {
                include: { wonItem: true }
            }
        }
      })
    ]);

    if (!room || !myTeam) {
      return NextResponse.json({ error: 'Room or Team not found' }, { status: 404 });
    }

    // Calculate derived state for "My Team"
    // Filter bids that WON an item (status=SOLD)
    const wonBids = myTeam.bids.filter(b => b.wonItem?.status === 'SOLD' && b.wonItem?.winningTeamId === teamId);
    const spentBudget = wonBids.reduce((sum, bid) => sum + bid.amount, 0);

    // Filter bids that are currently WINNING an active item (status=NOMINATED)
    const activeWinningBids = myTeam.bids.filter(b => b.wonItem?.status === 'NOMINATED' && b.wonItem?.winningTeamId === teamId);
    const lockedBudget = activeWinningBids.reduce((sum, bid) => sum + bid.amount, 0);
    
    const availableBudget = myTeam.budget - spentBudget - lockedBudget;
    
    // Calculate spots
    // Spots Used = Won Items + Active Winning Bids
    const spotsUsed = wonBids.length + activeWinningBids.length;
    const spotsRemaining = myTeam.rosterSpots - spotsUsed;

    // Get all active bids for this team (winning or losing) on NOMINATED items
    const myActiveBids = await prisma.bid.findMany({
      where: {
        teamId,
        status: 'VALID',
        auctionItem: {
          status: 'NOMINATED',
        },
      },
      select: {
        auctionItemId: true,
      },
      distinct: ['auctionItemId'], // Ensure unique items
    });

    const myActiveItemIds = myActiveBids.map(b => b.auctionItemId);

    return NextResponse.json({
      room,
      teams,
      activeItems,
      me: {
        ...myTeam,
        availableBudget,
        spotsRemaining,
        spentBudget,
        lockedBudget,
        activeItemIds: myActiveItemIds,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Sync Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
