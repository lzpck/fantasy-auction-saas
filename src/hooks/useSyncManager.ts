import { useEffect, useRef, useCallback } from 'react';
import { mutate } from 'swr';

/**
 * Global sync manager for coordinating real-time updates across all components.
 *
 * This hook provides a centralized way to trigger updates across all SWR caches
 * when actions like placing bids or retracting bids occur.
 */

type SyncEvent = 'bid_placed' | 'bid_retracted' | 'room_updated';

class SyncManager {
  private listeners: Map<string, Set<() => void>> = new Map();
  private lastSync: Map<string, number> = new Map();

  /**
   * Subscribe to sync events for a specific room
   */
  subscribe(roomId: string, callback: () => void) {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId)!.add(callback);

    return () => {
      const listeners = this.listeners.get(roomId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(roomId);
        }
      }
    };
  }

  /**
   * Trigger a sync event for a specific room
   */
  async sync(roomId: string, event: SyncEvent) {
    const now = Date.now();
    const lastSync = this.lastSync.get(roomId) || 0;

    // Debounce: prevent multiple syncs within 100ms
    if (now - lastSync < 100) {
      return;
    }

    this.lastSync.set(roomId, now);

    // Notify all subscribers
    const listeners = this.listeners.get(roomId);
    if (listeners) {
      listeners.forEach(callback => callback());
    }

    // Also invalidate SWR caches for this room
    await Promise.all([
      mutate(`/api/room/${roomId}/sync`),
      mutate((key) =>
        typeof key === 'string' &&
        key.startsWith(`/api/room/${roomId}/items`)
      ),
    ]);
  }

  /**
   * Get last sync timestamp for a room
   */
  getLastSync(roomId: string): number {
    return this.lastSync.get(roomId) || 0;
  }
}

// Global singleton instance
const syncManager = new SyncManager();

/**
 * Hook for components to participate in the global sync system
 */
export function useSyncManager(roomId: string) {
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  const triggerSync = useCallback(async (event: SyncEvent = 'room_updated') => {
    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Trigger sync immediately for critical events
    if (event === 'bid_placed' || event === 'bid_retracted') {
      await syncManager.sync(roomId, event);
    } else {
      // Debounce non-critical events
      syncTimeoutRef.current = setTimeout(() => {
        syncManager.sync(roomId, event);
      }, 100);
    }
  }, [roomId]);

  const subscribe = useCallback((callback: () => void) => {
    return syncManager.subscribe(roomId, callback);
  }, [roomId]);

  const getLastSync = useCallback(() => {
    return syncManager.getLastSync(roomId);
  }, [roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    triggerSync,
    subscribe,
    getLastSync,
  };
}

export { syncManager };
