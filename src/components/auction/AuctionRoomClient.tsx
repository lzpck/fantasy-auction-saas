'use client';

import { useState } from 'react';
import { useAuctionStore } from '@/hooks/useAuctionStore';
import { AuctionHeader } from './AuctionHeader';
import { ActiveBidsGrid } from './ActiveBidsGrid';
import { MarketTable } from './MarketTable';
import { placeBid } from '@/app/actions/bid';
import { retractBid } from '@/app/actions/admin-bid';
import type { RoomStatus } from '@prisma/client';
import { BidModal } from './BidModal';
import { AuctionSettings } from '@/types/auction-settings';

interface AuctionRoomClientProps {
  roomId: string;
  isOwner: boolean;
}

export function AuctionRoomClient({ roomId, isOwner }: AuctionRoomClientProps) {
  const { data, isLoading, mutate } = useAuctionStore(roomId);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string; currentBid: number } | null>(null);

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { me, activeItems } = data;

  // Parse settings safely
  let settings: AuctionSettings = {} as AuctionSettings;
  try {
      settings = JSON.parse(data.room.settings);
  } catch (e) {
      console.error("Failed to parse settings", e);
  }

  const handleOpenBidModal = (playerId: string, currentBid: number) => {
    const player = activeItems.find(i => i.id === playerId) || data.marketItems.find(i => i.id === playerId);
    if (player) {
        setSelectedPlayer({ id: playerId, name: player.name, currentBid });
        setBidModalOpen(true);
    }
  };

  const handlePlaceBid = async (amount: number, contractYears: number) => {
    if (!selectedPlayer) return;
    
    const result = await placeBid(roomId, selectedPlayer.id, amount, contractYears);
    if (result.success) {
      mutate(); // Trigger immediate re-fetch
      setBidModalOpen(false);
    } else {
      throw new Error(result.error);
    }
  };

  const handleRetractBid = async (itemId: string) => {
    const result = await retractBid(roomId, itemId);
    if (result.success) {
      mutate();
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
            onBid={(id, currentBid) => handleOpenBidModal(id, currentBid)}
            onRetract={handleRetractBid}
            isOwner={isOwner}
          />
        </section>

        {/* Market Section */}
        <section className="flex-1 min-h-0 flex flex-col pb-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
            O Mercado
          </h2>
          <MarketTable
            roomId={roomId}
            onBid={(id) => {
                const item = data.marketItems.find(i => i.id === id);
                handleOpenBidModal(id, item?.winningBid?.amount || 0);
            }}
            myTeamId={me.id}
          />
        </section>
      </main>

      {selectedPlayer && (
        <BidModal
          isOpen={bidModalOpen}
          onClose={() => setBidModalOpen(false)}
          onBid={handlePlaceBid}
          playerName={selectedPlayer.name}
          currentBid={selectedPlayer.currentBid}
          settings={settings}
          myBudget={me.availableBudget}
        />
      )}
    </div>
  );
}
