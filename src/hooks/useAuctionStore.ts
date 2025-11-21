import useSWR from 'swr';
import type { AuctionItem, AuctionRoom, AuctionTeam, Bid } from '@prisma/client';

export interface AuctionSyncData {
  room: Pick<AuctionRoom, 'status' | 'settings'>;
  teams: Pick<AuctionTeam, 'id' | 'name' | 'budget' | 'rosterSpots'>[];
  activeItems: (AuctionItem & { winningBid: Bid | null; expiresAt: Date | null })[];
  marketItems: (AuctionItem & { winningBid: Bid | null })[];
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
  const { data, error, isLoading, mutate } = useSWR<AuctionSyncData>(
    `/api/room/${roomId}/sync`,
    fetcher,
    {
      refreshInterval: 2000,
      revalidateOnFocus: true,
    }
  );

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
}
