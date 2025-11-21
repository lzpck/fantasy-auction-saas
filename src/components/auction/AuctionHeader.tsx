'use client';

import { LogOut, Play, Pause, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { toggleRoomStatus } from '@/app/actions/room-actions';
import { useTransition } from 'react';
import type { RoomStatus } from '@prisma/client';
import { formatCurrencyMillions } from '@/lib/format-millions';

interface AuctionHeaderProps {
  teamName: string;
  availableBudget: number;
  spotsRemaining: number;
  roomId: string;
  roomStatus: RoomStatus;
  isOwner: boolean;
  isRealtimeUpdate?: boolean;
}

export function AuctionHeader({
  teamName,
  availableBudget,
  spotsRemaining,
  roomId,
  roomStatus,
  isOwner,
  isRealtimeUpdate = false,
}: AuctionHeaderProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = () => {
    startTransition(async () => {
      await toggleRoomStatus(roomId);
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-50 flex items-center justify-between px-6 shadow-lg">
      <div className="flex items-center gap-6">
        {/* Real-time Sync Indicator */}
        {isRealtimeUpdate && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium animate-pulse">
            <RefreshCw size={10} className="animate-spin" />
            <span className="hidden sm:inline">Sync</span>
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Meu Time
          </span>
          <h1 className="text-xl font-bold text-white truncate max-w-[200px]">
            {teamName}
          </h1>
        </div>

        {/* Room Status Indicator & Control */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
            <div className={`flex flex-col items-start`}>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    Status
                </span>
                <span className={`font-bold ${roomStatus === 'OPEN' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {roomStatus === 'OPEN' ? 'EM ANDAMENTO' : 'PAUSADO'}
                </span>
            </div>
            {isOwner && (
              <button
                  onClick={handleToggleStatus}
                  disabled={isPending}
                  className={`
                      p-2 rounded-full transition-colors
                      ${roomStatus === 'OPEN'
                          ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }
                  `}
                  title={roomStatus === 'OPEN' ? "Pausar Leilão" : "Iniciar Leilão"}
              >
                  {roomStatus === 'OPEN' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
            )}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Orçamento
          </span>
          <span className="text-3xl font-mono font-bold text-emerald-400">
            {formatCurrencyMillions(availableBudget)}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Vagas
          </span>
          <span className={`text-3xl font-mono font-bold ${spotsRemaining > 0 ? 'text-blue-400' : 'text-red-500'}`}>
            {spotsRemaining}
          </span>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-sm font-medium ml-4"
        >
          <LogOut size={16} />
          Sair
        </Link>
      </div>
    </header>
  );
}
