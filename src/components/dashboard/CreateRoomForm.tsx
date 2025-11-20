'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createRoomFromSleeper } from '@/app/actions/create-room';
import { Activity, ArrowRight, Sparkles } from 'lucide-react';

export function CreateRoomForm() {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!leagueId || !adminPasscode) {
      setError('Informe o ID da Liga e uma senha de administrador.');
      return;
    }

    startTransition(async () => {
      const result = await createRoomFromSleeper(
        leagueId.trim(),
        adminPasscode.trim()
      );

      if (result.success && result.roomId) {
        setSuccess('Sala criada com sucesso. Redirecionando...');
        router.push(`/room/${result.roomId}`);
        return;
      }

      setError(result.error || 'Não foi possível criar a sala.');
    });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
      <header className="mb-8">
        <div className="mb-4 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 w-fit">
          <Sparkles className="h-4 w-4 text-sky-300" />
          <span>Nova Sala</span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          Importar do Sleeper
        </h2>
        <p className="mt-2 text-slate-300">
          Crie uma nova sala importando times e configurações da sua liga.
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
            <span>Senha da Sala (PIN)</span>
            <span className="text-xs text-slate-400">
              mínimo 4 caracteres
            </span>
          </label>
          <input
            value={adminPasscode}
            onChange={(event) => setAdminPasscode(event.target.value)}
            placeholder="PIN para acessar a sala"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base text-white outline-none transition ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {success}
          </div>
        )}

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
              Criar Sala
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
