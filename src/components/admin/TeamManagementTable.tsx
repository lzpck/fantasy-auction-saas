'use client';

import { useState } from 'react';
import { updateTeamStats, createTeam } from '@/app/actions/admin-room';
import { Save, Check, AlertCircle, Plus } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  budget: number;
  rosterSpots: number;
}

interface TeamManagementTableProps {
  teams: Team[];
  roomId?: string; // Optional for now to avoid breaking changes, but needed for create
}

export function TeamManagementTable({ teams, roomId }: TeamManagementTableProps) {
  const [editingTeams, setEditingTeams] = useState<Record<string, { name: string; budget: number; spots: number }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Team State
  const [newTeam, setNewTeam] = useState({ name: '', budget: 200, spots: 15 });
  const [isCreating, setIsCreating] = useState(false);

  const handleInputChange = (teamId: string, field: 'name' | 'budget' | 'spots', value: string | number) => {
    setEditingTeams(prev => ({
      ...prev,
      [teamId]: {
        name: prev[teamId]?.name ?? teams.find(t => t.id === teamId)?.name ?? '',
        budget: prev[teamId]?.budget ?? teams.find(t => t.id === teamId)?.budget ?? 0,
        spots: prev[teamId]?.spots ?? teams.find(t => t.id === teamId)?.rosterSpots ?? 0,
        [field]: value
      }
    }));
  };

  const handleSave = async (teamId: string) => {
    const updates = editingTeams[teamId];
    if (!updates) return;

    setSaving(teamId);
    setMessage(null);

    const result = await updateTeamStats(teamId, updates.name, updates.budget, updates.spots);

    if (result.success) {
      setMessage({ type: 'success', text: 'Time atualizado com sucesso!' });
      setEditingTeams(prev => {
        const newState = { ...prev };
        delete newState[teamId];
        return newState;
      });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao atualizar time.' });
    }

    setSaving(null);
  };

  const handleCreateTeam = async () => {
    if (!roomId) return;
    if (!newTeam.name.trim()) {
      setMessage({ type: 'error', text: 'Nome do time é obrigatório.' });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    const result = await createTeam(roomId, newTeam.name, newTeam.budget, newTeam.spots);

    if (result.success) {
      setMessage({ type: 'success', text: 'Time criado com sucesso!' });
      setNewTeam({ name: '', budget: 200, spots: 15 });
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao criar time.' });
    }

    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-900' : 'bg-red-900/30 text-red-400 border border-red-900'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {roomId && (
        <div className="p-4 border border-white/10 rounded-lg bg-slate-900/50 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" /> Adicionar Novo Time
          </h3>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1 w-full">
              <label className="text-xs text-slate-400">Nome do Time</label>
              <input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Kansas City Chiefs"
                className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs text-slate-400">Budget</label>
              <input
                type="number"
                value={newTeam.budget}
                onChange={(e) => setNewTeam(prev => ({ ...prev, budget: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs text-slate-400">Vagas</label>
              <input
                type="number"
                value={newTeam.spots}
                onChange={(e) => setNewTeam(prev => ({ ...prev, spots: Number(e.target.value) }))}
                className="w-full bg-slate-950 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              onClick={handleCreateTeam}
              disabled={isCreating}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors h-[42px]"
            >
              {isCreating ? 'Criando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900/50">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Budget ($)</th>
              <th className="px-4 py-3">Vagas</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const isEditing = !!editingTeams[team.id];
              const currentName = isEditing ? editingTeams[team.id].name : team.name;
              const currentBudget = isEditing ? editingTeams[team.id].budget : team.budget;
              const currentSpots = isEditing ? editingTeams[team.id].spots : team.rosterSpots;

              return (
                <tr key={team.id} className="border-b border-white/10 last:border-0 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) => handleInputChange(team.id, 'name', e.target.value)}
                      className="w-full bg-transparent border border-transparent hover:border-white/10 focus:border-sky-500 rounded px-2 py-1 text-white focus:outline-none focus:bg-slate-950 transition-colors"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={currentBudget}
                      onChange={(e) => handleInputChange(team.id, 'budget', Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={currentSpots}
                      onChange={(e) => handleInputChange(team.id, 'spots', Number(e.target.value))}
                      className="w-24 bg-slate-950 border border-white/10 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing && (
                      <button
                        onClick={() => handleSave(team.id)}
                        disabled={saving === team.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {saving === team.id ? '...' : <><Save className="w-3 h-3" /> Salvar</>}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {teams.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Nenhum time encontrado nesta sala.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
