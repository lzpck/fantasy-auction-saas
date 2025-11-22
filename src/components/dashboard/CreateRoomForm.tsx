'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createRoomFromSleeper } from '@/app/actions/create-room';
import { Activity, ArrowRight, Gavel } from 'lucide-react';
import { useToast } from '@/components/ui/toast/ToastProvider';

export function CreateRoomForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [leagueId, setLeagueId] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!leagueId || !adminPasscode) {
      showToast('error', 'Informe o ID da Liga e uma senha de administrador.');
      return;
    }

    startTransition(async () => {
      const result = await createRoomFromSleeper(
        leagueId.trim(),
        adminPasscode.trim()
      );

      if (result.success && result.roomId) {
        showToast('success', 'Sala criada com sucesso! Redirecionando...');
        router.push(`/room/${result.roomId}`);
        return;
      }

      showToast('error', result.error || 'Não foi possível criar a sala.');
    });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
      <header className="mb-8">
        <div className="mb-4 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 w-fit">
          <Gavel className="h-4 w-4 text-sky-300" />
          <span>Novo War Room</span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          Importar do Sleeper
        </h2>
        <p className="mt-2 text-slate-300">
          Crie um novo War Room importando times e configurações da sua liga.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-6 shadow-inner"
      >
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-200">
            ID da Liga Sleeper
          </label>
          <input
            value={leagueId}
            onChange={(event) => setLeagueId(event.target.value)}
            placeholder="ex: 1050453674455541760"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base text-white outline-none transition ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm font-semibold text-slate-200">
            <span>Senha do War Room (PIN)</span>
            <span className="text-xs text-slate-400">
              mínimo 4 caracteres
            </span>
          </label>
          <input
            value={adminPasscode}
            onChange={(event) => setAdminPasscode(event.target.value)}
            placeholder="PIN para acessar o War Room"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base text-white outline-none transition ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-5 py-3 text-lg font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:scale-[1.01] hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? (
            <>
              <Activity className="h-5 w-5 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              Criar War Room
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
