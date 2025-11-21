'use client';

import { useState } from 'react';
import { Search, Trash2, AlertTriangle } from 'lucide-react';
import { deletePlayer, clearAllPlayers } from '@/app/actions/admin-room';

interface Player {
  id: string;
  name: string;
  position: string;
  nflTeam: string | null;
  status: string;
}

interface PlayerListProps {
  roomId: string;
  players: Player[];
}

export function PlayerList({ roomId, players }: PlayerListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const filteredPlayers = players.filter(player => 
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (player.nflTeam && player.nflTeam.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (playerId: string) => {
    if (!confirm('Tem certeza que deseja remover este jogador?')) return;
    
    setIsDeleting(playerId);
    await deletePlayer(playerId);
    setIsDeleting(null);
  };

  const handleClearAll = async () => {
    if (!confirm('ATENÇÃO: Isso removerá TODOS os jogadores da sala. Esta ação não pode ser desfeita. Tem certeza?')) return;
    
    setIsClearing(true);
    await clearAllPlayers(roomId);
    setIsClearing(false);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-900/50 border-white/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">Lista de Jogadores ({players.length})</h3>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar jogador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 w-full md:w-64"
            />
          </div>
          
          {players.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={isClearing}
              className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              title="Remover todos os jogadores"
            >
              {isClearing ? <span className="animate-spin">⏳</span> : <Trash2 className="w-4 h-4" />}
              <span className="hidden md:inline">Limpar Tudo</span>
            </button>
          )}
        </div>
      </div>

      <div className="border border-white/10 rounded-md overflow-hidden max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-900 text-white sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Posição</th>
              <th className="px-4 py-2">Time NFL</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map((player) => (
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
            {filteredPlayers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {searchTerm ? 'Nenhum jogador encontrado para a busca.' : 'Nenhum jogador cadastrado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
