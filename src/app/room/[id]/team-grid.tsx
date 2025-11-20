'use client';

import { claimTeam, loginTeam, logoutTeam, TeamSession } from '@/app/actions/auth';
import { Loader2, LockKeyhole, LogIn, Crown, DoorOpen, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

export interface TeamCardData {
  id: string;
  name: string;
  ownerName: string | null;
  budget: number;
  rosterSpots: number;
  pinHash: string | null;
}

interface ModalState {
  team: TeamCardData;
  mode: 'claim' | 'login';
}

export default function TeamGrid({
  roomId,
  teams,
  session,
}: {
  roomId: string;
  teams: TeamCardData[];
  session: TeamSession | null;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sessionTeamIds = useMemo(() => new Set(session ? [session.teamId] : []), [session]);

  const openModal = (team: TeamCardData) => {
    setPin('');
    setError(null);
    setModal({
      team,
      mode: team.pinHash ? 'login' : 'claim',
    });
  };

  const closeModal = () => {
    setModal(null);
    setPin('');
    setError(null);
  };

  const handleSubmit = () => {
    if (!modal) return;

    if (pin.length !== 4) {
      setError('Informe um PIN de 4 digitos.');
      return;
    }

    startTransition(async () => {
      const isClaim = modal.mode === 'claim';
      const result = isClaim
        ? await claimTeam(modal.team.id, pin, roomId)
        : await loginTeam(modal.team.id, pin);

      if (result.success) {
        closeModal();
        router.refresh();
        return;
      }

      setError(result.error || 'Falha ao autenticar');
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutTeam();
      router.refresh();
    });
  };



  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => {
          const isClaimed = Boolean(team.pinHash);
          const isYours = sessionTeamIds.has(team.id);

          return (
            <div
              key={team.id}
              className={`relative flex flex-col overflow-hidden rounded-2xl border transition ${
                isYours
                  ? 'border-emerald-400/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              {/* Status Badge (Top Right) */}
              <div className="absolute right-4 top-4 flex gap-2">
                {isYours ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-50">
                    <Crown className="h-3.5 w-3.5" />
                    SEU TIME
                  </div>
                ) : (
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isClaimed
                        ? 'bg-white/10 text-slate-300'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isClaimed ? 'bg-slate-500' : 'bg-emerald-400'
                      }`}
                    />
                    {isClaimed ? 'Reivindicado' : 'Disponível'}
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="mb-4 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Time
                  </p>
                  <h3 className="truncate text-xl font-bold text-white" title={team.name}>
                    {team.name}
                  </h3>
                  <p className="text-sm text-slate-400">
                    <span className="text-slate-500">Dono:</span>{' '}
                    <span className="text-slate-200">
                      {team.ownerName || 'Pendente'}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                    <p className="text-xs text-slate-500">Budget</p>
                    <p className="text-lg font-semibold text-white">
                      ${team.budget.toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                    <p className="text-xs text-slate-500">Vagas</p>
                    <p className="text-lg font-semibold text-white">
                      {team.rosterSpots}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button (Bottom Full Width) */}
              <div className="mt-auto border-t border-white/5 bg-white/5 p-4">
                {isYours ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => router.push(`/room/${roomId}`)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Painel
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                      <DoorOpen className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openModal(team)}
                    className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      team.pinHash
                        ? 'bg-white/10 text-white hover:bg-white/20'
                        : 'bg-sky-500 text-slate-950 hover:bg-sky-400 shadow-lg shadow-sky-500/20'
                    }`}
                  >
                    {team.pinHash ? (
                      <>
                        <LogIn className="h-4 w-4" />
                        Entrar com PIN
                      </>
                    ) : (
                      <>
                        <LockKeyhole className="h-4 w-4" />
                        Reivindicar Time
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {modal.mode === 'claim' ? 'Reivindicar Time' : 'Entrar no Time'}
                </p>
                <h3 className="text-2xl font-bold text-white">{modal.team.name}</h3>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:border-white/30"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200">
                PIN de 4 dígitos
              </label>
              <input
                autoFocus
                value={pin}
                maxLength={4}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                placeholder="Digite seu PIN"
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
              />
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : modal.mode === 'claim' ? (
                  <>
                    <LockKeyhole className="h-4 w-4" />
                    Criar PIN e Entrar
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar no Time
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
