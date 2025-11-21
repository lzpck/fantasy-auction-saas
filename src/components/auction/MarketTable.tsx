'use client';

import type { AuctionItem, Bid } from '@prisma/client';
import { useState, useEffect } from 'react';
import { Gavel, UserPlus, Search, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import useSWR from 'swr';

interface MarketTableProps {
  roomId: string;
  onBid: (playerId: string, amount: number) => void;
  myTeamId: string;
}

const POSITIONS = ['ALL', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DL', 'LB', 'DB'];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function TableCountdown({ expiresAt }: { expiresAt: Date | null }) {
  const [timeLeft, setTimeLeft] = useState('-');

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = new Date(expiresAt).getTime() - now;

      if (distance < 0) {
        setTimeLeft('EXPIRADO');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTime(); // Initial calculation
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt) return <span className="text-slate-500">-</span>;

  return (
    <div className="flex items-center gap-1 text-xs font-mono text-amber-400">
      <Clock size={12} />
      {timeLeft}
    </div>
  );
}

export function MarketTable({ roomId, onBid, myTeamId }: MarketTableProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  
  const { data, isLoading } = useSWR(
    `/api/room/${roomId}/items?page=${page}&limit=50&search=${search}&position=${selectedPosition}`,
    fetcher,
    { keepPreviousData: true }
  );

  const items: (AuctionItem & { winningBid: (Bid & { team: { name: string; ownerName: string | null } }) | null; expiresAt: Date | null })[] = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 max-w-full no-scrollbar">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => { setSelectedPosition(pos); setPage(1); }}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap
                ${
                  selectedPosition === pos
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }
              `}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-900/50 relative">
        {isLoading && (
             <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center z-20 backdrop-blur-sm">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
             </div>
        )}
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10">
            <tr>
              <th className="p-3 font-medium">Pos</th>
              <th className="p-3 font-medium">Nome</th>
              <th className="p-3 font-medium">Time</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Contrato</th>
              <th className="p-3 font-medium text-right">Maior Lance</th>
              <th className="p-3 font-medium text-right">Vencendo</th>
              <th className="p-3 font-medium text-right">Tempo</th>
              <th className="p-3 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((item) => {
              const currentBid = item.winningBid?.amount || 0;
              const isWinning = item.winningTeamId === myTeamId;
              const isNominated = item.status === 'NOMINATED';
              const isSold = item.status === 'SOLD';
              
              // Calculate next bid (unused here, handled in modal)
              // const nextBid = currentBid === 0 ? 1 : Math.ceil(currentBid * 1.15);

              return (
                <tr
                  key={item.id}
                  className={`
                    group transition-colors
                    ${isNominated ? 'bg-slate-900/80' : 'hover:bg-slate-800/50'}
                    ${isSold ? 'opacity-50 grayscale' : ''}
                  `}
                >
                  <td className="p-3">
                    <span
                      className={`
                      px-2 py-1 rounded text-xs font-bold w-12 text-center inline-block
                      ${
                        item.position === 'QB'
                          ? 'bg-pink-900/50 text-pink-300 border border-pink-700/50'
                          : item.position === 'RB'
                          ? 'bg-green-900/50 text-green-300 border border-green-700/50'
                          : item.position === 'WR'
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                          : item.position === 'TE'
                          ? 'bg-orange-900/50 text-orange-300 border border-orange-700/50'
                          : ['DL', 'LB', 'DB'].includes(item.position)
                          ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                          : 'bg-slate-800 text-slate-400'
                      }
                    `}
                    >
                      {item.position}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-200">{item.name}</td>
                  <td className="p-3 text-slate-400">{item.nflTeam}</td>
                  <td className="p-3">
                    <span
                      className={`
                      text-xs font-bold uppercase tracking-wider
                      ${
                        item.status === 'NOMINATED'
                          ? 'text-amber-400 animate-pulse'
                          : item.status === 'SOLD'
                          ? 'text-slate-500'
                          : 'text-emerald-400'
                      }
                    `}
                    >
                      {item.status === 'PENDING' ? 'Disponível' : item.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300">
                    {item.contractYears ? `${item.contractYears} ano${item.contractYears > 1 ? 's' : ''}` : '-'}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-300">
                    {currentBid > 0 ? `$${currentBid}` : '-'}
                  </td>
                  <td className="p-3 text-right">
                    {item.winningBid ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs font-semibold text-slate-300">
                          {item.winningBid.team.name}
                        </span>
                        {item.winningBid.team.ownerName && (
                          <span className="text-xs text-slate-500">
                            {item.winningBid.team.ownerName}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">-</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <TableCountdown expiresAt={item.expiresAt ? new Date(item.expiresAt) : null} />
                  </td>
                  <td className="p-3 text-right">
                    {!isSold && (
                      <button
                        onClick={() => onBid(item.id, currentBid)}
                        disabled={isWinning}
                        className={`
                          px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ml-auto
                          ${
                            isWinning
                              ? 'bg-emerald-900/20 text-emerald-500 cursor-default border border-emerald-900'
                              : isNominated
                              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }
                        `}
                      >
                        {isWinning ? (
                          'Vencendo'
                        ) : isNominated ? (
                          <>
                            <Gavel size={14} />
                            Entrar
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            Dar Lance
                          </>
                        )}
                      </button>
                    )}
                    {isSold && (
                        <span className="text-xs text-slate-600">Vendido</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && !isLoading && (
                <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                        Nenhum jogador encontrado.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-slate-800 pt-2">
          <span className="text-xs text-slate-500">
              Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded bg-slate-800 text-slate-400 disabled:opacity-50 hover:bg-slate-700 transition-colors"
              >
                  <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded bg-slate-800 text-slate-400 disabled:opacity-50 hover:bg-slate-700 transition-colors"
              >
                  <ChevronRight size={16} />
              </button>
          </div>
      </div>
    </div>
  );
}
