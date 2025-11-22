'use client';

import { useState } from 'react';
import { Search, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { deletePlayer, clearAllPlayers } from '@/app/actions/admin-room';
import useSWR from 'swr';

interface Player {
  id: string;
  name: string;
  position: string;
  nflTeam: string | null;
  status: string;
}

interface PlayerListProps {
  roomId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PlayerList({ roomId }: PlayerListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    `/api/room/${roomId}/items?page=${page}&limit=50&search=${search}`,
    fetcher,
    {
      keepPreviousData: true,
    }
  );

  const players: Player[] = data?.items || [];
  const totalPages = data?.totalPages || 1;
  const totalPlayers = data?.total || 0;

  const handleDelete = async (playerId: string) => {
    if (!confirm('Tem certeza que deseja remover este jogador?')) return;
    
    setIsDeleting(playerId);
    await deletePlayer(playerId);
    await mutate(); // Refresh list
    setIsDeleting(null);
  };

  const handleClearAll = async () => {
    if (!confirm('ATENÇÃO: Isso removerá TODOS os jogadores da sala. Esta ação não pode ser desfeita. Tem certeza?')) return;
    
    setIsClearing(true);
    await clearAllPlayers(roomId);
    await mutate(); // Refresh list
    setIsClearing(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-900/50 border-white/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Lista de Jogadores 
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />}
            {!isLoading && <span className="text-sm font-normal text-slate-400">({totalPlayers})</span>}
        </h3>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar jogador..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-full md:w-64"
            />
          </div>
          
          <button
            onClick={handleClearAll}
            disabled={isClearing || totalPlayers === 0}
            className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remover todos os jogadores"
          >
            {isClearing ? <span className="animate-spin">⏳</span> : <Trash2 className="w-4 h-4" />}
            <span className="hidden md:inline">Limpar Tudo</span>
          </button>
        </div>
      </div>

      <div className="border border-white/10 rounded-md overflow-hidden relative min-h-[200px]">
        {isLoading && (
             <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center z-20 backdrop-blur-sm">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
             </div>
        )}
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
            <thead className="bg-slate-900 text-white">
                <tr>
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Posição</th>
                <th className="px-4 py-2">Time NFL</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Ações</th>
                </tr>
            </thead>
            <tbody>
                {players.map((player) => (
                <tr key={player.id} className="border-b border-white/10 last:border-0 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-2 font-medium text-white">{player.name}</td>
                    <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-medium border border-white/5">
                        {player.position}
                    </span>
                    </td>
                    <td className="px-4 py-2">{player.nflTeam || '-'}</td>
                    <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                        player.status === 'SOLD' 
                        ? 'bg-emerald-900/30 text-emerald-400 border-emerald-900/50' 
                        : 'bg-slate-800 text-slate-400 border-white/5'
                    }`}>
                        {player.status === 'SOLD' ? 'Vendido' : 'Pendente'}
                    </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                    <button
                        onClick={() => handleDelete(player.id)}
                        disabled={isDeleting === player.id}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                        title="Remover jogador"
                    >
                        {isDeleting === player.id ? '...' : <Trash2 className="w-4 h-4" />}
                    </button>
                    </td>
                </tr>
                ))}
                {players.length === 0 && !isLoading && (
                <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    {search ? 'Nenhum jogador encontrado para a busca.' : 'Nenhum jogador cadastrado.'}
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
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
      )}
    </div>
  );
}
