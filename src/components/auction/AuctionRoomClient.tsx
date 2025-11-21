'use client';

import { useAuctionStore } from '@/hooks/useAuctionStore';
import { AuctionHeader } from './AuctionHeader';
import { ActiveBidsGrid } from './ActiveBidsGrid';
import { MarketTable } from './MarketTable';
import { placeBid } from '@/app/actions/bid';
import { RoomStatus } from '@prisma/client';

interface AuctionRoomClientProps {
  roomId: string;
  isOwner: boolean;
}

export function AuctionRoomClient({ roomId, isOwner }: AuctionRoomClientProps) {
  const { data, isLoading, mutate } = useAuctionStore(roomId);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { me, activeItems } = data;

  const handleBid = async (playerId: string, amount: number) => {
    const result = await placeBid(roomId, playerId, amount);
    if (result.success) {
      mutate(); // Trigger immediate re-fetch
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200 selection:bg-emerald-500/30">
      <AuctionHeader
        teamName={me.name}
        availableBudget={me.availableBudget}
        spotsRemaining={me.spotsRemaining}
        roomId={roomId}
        roomStatus={data.room.status as RoomStatus}
        isOwner={isOwner}
      />

      <main className="flex-1 flex flex-col pt-24 px-6 gap-6 overflow-hidden h-screen">
        {/* Active Battles Section */}
        <section className="flex-none">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Negociações Ativas
          </h2>
          <ActiveBidsGrid
            myTeamId={me.id}
            activeBids={activeItems.filter((i) => me.activeItemIds.includes(i.id))}
            onBid={handleBid}
            isOwner={isOwner}
            roomId={roomId}
          />
        </section>

        {/* Market Section */}
        <section className="flex-1 min-h-0 flex flex-col pb-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            O Mercado
          </h2>
          <MarketTable
            roomId={roomId}
            onBid={handleBid}
            myTeamId={me.id}
          />
        </section>
      </main>
    </div>
  );
}
