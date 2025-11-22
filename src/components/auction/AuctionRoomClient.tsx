'use client';

import { useState, useEffect } from 'react';
import { useAuctionStore } from '@/hooks/useAuctionStore';
import { useSyncManager } from '@/hooks/useSyncManager';
import { AuctionHeader } from './AuctionHeader';
import { ActiveBidsGrid } from './ActiveBidsGrid';
import { AdminActiveItemsGrid } from './AdminActiveItemsGrid';
import { MarketTable } from './MarketTable';
import { placeBid } from '@/app/actions/bid';
import { retractBid } from '@/app/actions/admin-bid';
import type { RoomStatus } from '@prisma/client';
import { BidModal } from './BidModal';
import { AuctionSettings } from '@/types/auction-settings';
import { useToast } from '@/components/ui/toast/ToastProvider';

interface AuctionRoomClientProps {
  roomId: string;
  isOwner: boolean;
}

export function AuctionRoomClient({ roomId, isOwner }: AuctionRoomClientProps) {
  const { showToast } = useToast();
  const { data, isLoading, mutate, isRealtimeUpdate } = useAuctionStore(roomId);
  const { triggerSync } = useSyncManager(roomId);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; name: string; currentBid: number } | null>(null);

  // Close modal if item expires while open
  useEffect(() => {
    if (bidModalOpen && selectedPlayer && data) {
      const player = data.activeItems.find(i => i.id === selectedPlayer.id);
      // Check if player exists in active items and is expired
      // Note: If player is removed from activeItems (e.g. sold), we might also want to close
      if (player?.expiresAt && new Date(player.expiresAt).getTime() < Date.now()) {
        setBidModalOpen(false);
        setSelectedPlayer(null);
        showToast('warning', 'Lance expirado');
      }
    }
  }, [data, bidModalOpen, selectedPlayer]);

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
        // Check if expired
        if (player.expiresAt && new Date(player.expiresAt).getTime() < Date.now()) {
            showToast('warning', 'Lance expirado');
            return;
        }

        setSelectedPlayer({ id: playerId, name: player.name, currentBid });
        setBidModalOpen(true);
    }
  };

  const handlePlaceBid = async (amount: number, contractYears: number) => {
    if (!selectedPlayer) return;

    const result = await placeBid(roomId, selectedPlayer.id, amount, contractYears);
    if (result.success) {
      // Trigger global sync to update all components immediately
      await triggerSync('bid_placed');
      setBidModalOpen(false);
    } else {
      throw new Error(result.error);
    }
  };

  const handleRetractBid = async (itemId: string) => {
    const result = await retractBid(roomId, itemId);
    if (result.success) {
      // Trigger global sync to update all components immediately
      await triggerSync('bid_retracted');
    } else {
      showToast('error', result.error || 'Erro ao retirar lance');
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
        isRealtimeUpdate={isRealtimeUpdate}
      />

      <main className="flex-1 flex flex-col pt-24 px-6 gap-6 overflow-hidden h-screen">
        {/* Admin Section - All Active Items */}
        {isOwner && (
          <section className="flex-none">
            <AdminActiveItemsGrid
              roomId={roomId}
              onRetract={handleRetractBid}
            />
          </section>
        )}

        {/* Active Battles Section */}
        <section className="flex-none">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {isOwner ? 'Minhas Negociações' : 'Negociações Ativas'}
          </h2>
          <ActiveBidsGrid
            myTeamId={me.id}
            activeBids={activeItems.filter((i) => me.activeItemIds.includes(i.id))}
            onBid={(id, currentBid) => handleOpenBidModal(id, currentBid)}
            onRetract={handleRetractBid}
            isOwner={isOwner}
            settings={settings}
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
