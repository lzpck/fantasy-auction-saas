'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Users, Shield, LogOut } from 'lucide-react';
import { logoutAdmin } from '@/app/actions/admin-auth';
import { AuctionSettings } from '@/types/auction-settings';
import { PlayerImport } from './PlayerImport';
import { PlayerList } from './PlayerList';
import { RoomSettingsForm } from './RoomSettingsForm';
import { TeamManagementTable } from './TeamManagementTable';

interface Team {
  id: string;
  name: string;
  budget: number;
  rosterSpots: number;
}

interface AdminRoomDashboardProps {
  roomId: string;
  roomName: string;
  settings: AuctionSettings;
  teams: Team[];
  players: Array<{
    id: string;
    name: string;
    position: string;
    nflTeam: string | null;
    status: string;
  }>;
  userName: string;
}

export function AdminRoomDashboard({ roomId, roomName, settings, teams, players, userName }: AdminRoomDashboardProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'players' | 'teams'>('general');

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-white/10 bg-slate-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-400" />
            <span className="text-lg font-bold">Fantasy Auction</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Olá, {userName}
            </span>
            <button 
              onClick={() => logoutAdmin()}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 transition"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Link 
                href="/dashboard" 
                className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para o Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Shield className="w-8 h-8 text-sky-500" />
                Admin: {roomName}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Gerenciamento detalhado da sala (God Mode)
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex border-b border-white/10 overflow-x-auto">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'general'
                  ? 'border-sky-500 text-sky-500'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" /> Geral
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'players'
                  ? 'border-sky-500 text-sky-500'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Users className="w-4 h-4" /> Jogadores
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'teams'
                  ? 'border-sky-500 text-sky-500'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" /> Times
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <RoomSettingsForm roomId={roomId} initialSettings={settings} />
              </div>
            )}

            {activeTab === 'players' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                     <PlayerImport roomId={roomId} />
                     <PlayerList roomId={roomId} players={players} />
                  </div>
                  <div className="bg-slate-900/50 border border-white/10 rounded-lg p-6 h-fit">
                    <h3 className="text-lg font-semibold text-white mb-4">Resumo</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-950 rounded-md">
                        <span className="text-slate-400">Total de Jogadores</span>
                        <span className="text-2xl font-bold text-white">{players.length}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Jogadores importados ficam com status &quot;PENDING&quot; até serem nomeados para leilão.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TeamManagementTable teams={teams} roomId={roomId} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
