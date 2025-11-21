'use client';

import type { AuctionItem, Bid } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertCircle, Clock, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';


interface ActiveBidsGridProps {
  myTeamId: string;
  activeBids: (AuctionItem & { winningBid: Bid | null; winningTeamName?: string; expiresAt: Date | null })[];
  onBid: (playerId: string, amount: number) => void;
  onRetract?: (itemId: string) => void;
  isOwner?: boolean;
}

function Countdown({ expiresAt }: { expiresAt: Date | null }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(expiresAt).getTime() - now;

      if (distance < 0) {
        setTimeLeft('EXPIRADO');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const fmt = (n: number) => n.toString().padStart(2, '0');
      setTimeLeft(`${fmt(hours)}:${fmt(minutes)}:${fmt(seconds)}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return null;

  return (
    <div className="flex items-center gap-1 text-xs font-mono text-amber-400 bg-amber-950/30 px-2 py-1 rounded">
      <Clock size={12} />
      {timeLeft}
    </div>
  );
}

export function ActiveBidsGrid({
  myTeamId,
  activeBids,
  onBid,
  onRetract,
  isOwner,
}: ActiveBidsGridProps) {
  if (activeBids.length === 0) {
    return null;
  }

  const handleRetract = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja retirar o último lance deste item?')) return;
    if (onRetract) {
      onRetract(itemId);
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-4 pt-2">
      <div className="flex gap-4 px-6 min-w-max">
        <AnimatePresence>
          {[...activeBids]
            .sort((a, b) => {
              // Sort by time remaining (shortest first)
              const timeA = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
              const timeB = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
              if (timeA !== timeB) return timeA - timeB;

              // Tie-breaker 1: Highest bid
              const bidA = a.winningBid?.amount || 0;
              const bidB = b.winningBid?.amount || 0;
              if (bidA !== bidB) return bidB - bidA;

              // Tie-breaker 2: Oldest bid (using timestamp if available, else 0)
              const dateA = a.winningBid?.timestamp ? new Date(a.winningBid.timestamp).getTime() : 0;
              const dateB = b.winningBid?.timestamp ? new Date(b.winningBid.timestamp).getTime() : 0;
              return dateA - dateB;
            })
            .map((item) => {
            const isWinning = item.winningTeamId === myTeamId;
            const currentBid = item.winningBid?.amount || 0;
            const nextBid = Math.ceil(currentBid * 1.15);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                layout
                className={`
                  relative w-64 p-4 rounded-xl border-2 shadow-xl flex flex-col gap-3
                  ${
                    isWinning
                      ? 'bg-slate-900/80 border-emerald-500/50 shadow-emerald-900/20'
                      : 'bg-slate-900/80 border-rose-500 shadow-rose-900/20 animate-pulse-border'
                  }
                `}
              >
                {/* Status Badge */}
                <div
                  className={`
                    absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2
                    ${
                      isWinning
                        ? 'bg-emerald-500 text-emerald-950'
                        : 'bg-rose-500 text-white'
                    }
                  `}
                >
                  {isWinning ? 'Vencendo' : 'Superado'}
                </div>

                {/* Player Info */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-500 overflow-hidden">
                    {item.name.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`px-1.5 py-0.5 rounded font-bold
                        ${
                          ['DL', 'LB', 'DB'].includes(item.position) 
                            ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                            : 'bg-slate-800'
                        }
                      `}>
                        {item.position}
                      </span>
                      <span>{item.nflTeam}</span>
                    </div>
                  </div>
                </div>

                {/* Timer & Bid Info */}
                <div className="flex flex-col gap-2 bg-slate-950/50 p-3 rounded-lg">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-1">
                    <span className="text-xs text-slate-400">Tempo Restante</span>
                    <Countdown expiresAt={item.expiresAt ? new Date(item.expiresAt) : null} />
                  </div>
                  
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">Vencendo</span>
                        <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px]" title={isWinning ? 'Você' : item.winningTeamName || 'Desconhecido'}>
                          {isWinning ? 'Você' : item.winningTeamName || '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-xl font-bold text-slate-200 block">
                          ${currentBid}
                        </span>
                        {item.contractYears && (
                          <span className="text-xs text-slate-400 font-mono">
                            {item.contractYears} ano{item.contractYears > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                </div>

                {/* Action Button */}
                {!isWinning && (
                  <button
                    onClick={() => onBid(item.id, currentBid)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-lg shadow-rose-900/50 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <AlertCircle size={16} />
                    COBRIR (${nextBid})
                  </button>
                )}
                
                {isWinning && (
                     <div className="w-full py-2 text-center text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                         <TrendingUp size={14} />
                         Lance Líder
                     </div>
                )}

                {/* Admin Retract Button */}
                {isOwner && (
                  <button
                    onClick={() => handleRetract(item.id)}
                    className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-full transition-colors"
                    title="Retirar último lance"
                  >
                    <Undo2 size={14} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
