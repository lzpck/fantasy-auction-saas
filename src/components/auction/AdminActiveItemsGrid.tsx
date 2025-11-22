'use client';

import type { AuctionItem, Bid } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Undo2, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { formatCurrencyMillions } from '@/lib/format-millions';
import { getPositionColor } from '@/constants/position-colors';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/toast/ToastProvider';

interface AdminActiveItemsGridProps {
  roomId: string;
  onRetract: (itemId: string) => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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

export function AdminActiveItemsGrid({ roomId, onRetract }: AdminActiveItemsGridProps) {
  const { showToast } = useToast();
  const [itemToRetract, setItemToRetract] = useState<string | null>(null);
  const [isRetracting, setIsRetracting] = useState(false);

  const { data, mutate } = useSWR(
    `/api/room/${roomId}/admin/active-items`,
    fetcher,
    {
      refreshInterval: 3000,
      revalidateOnFocus: true,
    }
  );

  const activeItems: (AuctionItem & {
    winningBid: (Bid & { team: { name: string; ownerName: string | null } }) | null;
    expiresAt: Date | null
  })[] = data?.activeItems || [];

  const confirmRetract = async () => {
    if (!itemToRetract) return;

    setIsRetracting(true);
    try {
      await onRetract(itemToRetract);
      await mutate(); // Refresh the data after retraction
      showToast('success', 'Lance retirado com sucesso!');
    } catch (error) {
      showToast('error', 'Erro ao retirar lance.');
    } finally {
      setIsRetracting(false);
      setItemToRetract(null);
    }
  };

  if (activeItems.length === 0) {
    return <EmptyState icon={Shield} message="Nenhum lance ativo no momento" />;
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} className="text-emerald-500" />
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
          Gerenciar Todos os Lances ({activeItems.length})
        </h3>
      </div>

      <div className="w-full overflow-x-auto pb-4 pt-2">
        <div className="flex gap-4 px-6 min-w-max">
          <AnimatePresence>
            {activeItems
              .sort((a, b) => {
                // Sort by time remaining (shortest first)
                const timeA = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
                const timeB = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
                if (timeA !== timeB) return timeA - timeB;

                // Tie-breaker: Highest bid
                const bidA = a.winningBid?.amount || 0;
                const bidB = b.winningBid?.amount || 0;
                return bidB - bidA;
              })
              .map((item) => {
                const currentBid = item.winningBid?.amount || 0;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    layout
                    className="relative w-64 p-4 rounded-xl border-2 bg-slate-900/80 border-emerald-500/50 shadow-xl shadow-emerald-900/20 flex flex-col gap-3"
                  >
                    {/* Admin Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm flex items-center gap-2 bg-emerald-500 text-emerald-950">
                      <Shield size={12} />
                      Admin
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
                          <span className={`px-1.5 py-0.5 rounded font-bold ${getPositionColor(item.position)}`}>
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
                          {item.winningBid?.team ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-semibold text-slate-300 truncate max-w-[120px]" title={item.winningBid.team.name}>
                                {item.winningBid.team.name}
                              </span>
                              {item.winningBid.team.ownerName && (
                                <span className="text-xs text-slate-500 truncate max-w-[120px]" title={item.winningBid.team.ownerName}>
                                  {item.winningBid.team.ownerName}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xl font-bold text-slate-200 block">
                            {formatCurrencyMillions(currentBid)}
                          </span>
                          {item.contractYears && (
                            <span className="text-xs text-slate-400 font-mono">
                              {item.contractYears} ano{item.contractYears > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Retract Button */}
                    <button
                      onClick={() => setItemToRetract(item.id)}
                      disabled={isRetracting && itemToRetract === item.id}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shadow-lg shadow-rose-900/50 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Undo2 size={16} />
                      Retirar Lance
                    </button>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog
        isOpen={!!itemToRetract}
        onClose={() => setItemToRetract(null)}
        onConfirm={confirmRetract}
        title="Retirar Lance?"
        description="Tem certeza que deseja retirar o último lance deste item? Esta ação não pode ser desfeita."
        confirmText="Sim, Retirar"
        cancelText="Cancelar"
        variant="warning"
        isLoading={isRetracting}
        loadingText="Retirando..."
      />
    </div>
  );
}
