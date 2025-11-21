import { useEffect, useState } from 'react';
import useSWR from 'swr';
import type { AuctionItem, AuctionRoom, AuctionTeam, Bid } from '@prisma/client';
import { useSyncManager } from './useSyncManager';

export interface AuctionSyncData {
  room: Pick<AuctionRoom, 'status' | 'settings'>;
  teams: Pick<AuctionTeam, 'id' | 'name' | 'budget' | 'rosterSpots'>[];
  activeItems: (AuctionItem & { winningBid: (Bid & { team: { name: string; ownerName: string | null } }) | null; expiresAt: Date | null })[];
  marketItems: (AuctionItem & { winningBid: (Bid & { team: { name: string; ownerName: string | null } }) | null })[];
  me: AuctionTeam & {
    availableBudget: number;
    spotsRemaining: number;
    spentBudget: number;
    lockedBudget: number;
    activeItemIds: string[];
  };
  timestamp: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAuctionStore(roomId: string) {
  const [isRealtimeUpdate, setIsRealtimeUpdate] = useState(false);
  const { subscribe } = useSyncManager(roomId);

  const { data, error, isLoading, mutate } = useSWR<AuctionSyncData>(
    `/api/room/${roomId}/sync`,
    fetcher,
    {
      refreshInterval: 2000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000,
    }
  );

  // Subscribe to global sync events
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setIsRealtimeUpdate(true);
      mutate();

      // Reset the realtime indicator after animation
      setTimeout(() => setIsRealtimeUpdate(false), 1000);
    });

    return unsubscribe;
  }, [subscribe, mutate]);

  return {
    data,
    isLoading,
    isError: error,
    mutate,
    isRealtimeUpdate,
  };
}
