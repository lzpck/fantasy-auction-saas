"use client";

import { Sparkles, ShieldCheck, ArrowRight, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRoomFromSleeper } from "./actions/create-room";

export default function HomePage() {
  const router = useRouter();
  const [leagueId, setLeagueId] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!leagueId || !adminPasscode) {
      setError("Informe o ID da Liga e uma senha de administrador.");
      return;
    }

    startTransition(async () => {
      const result = await createRoomFromSleeper(
        leagueId.trim(),
        adminPasscode.trim()
      );

      if (result.success && result.roomId) {
        setSuccess("Sala criada com sucesso. Redirecionando...");
        router.push(`/room/${result.roomId}`);
        return;
      }

      setError(result.error || "Não foi possível criar a sala.");
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.08),transparent_35%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
          <Sparkles className="h-4 w-4 text-sky-300" />
          <span>Importe sua liga do Sleeper em segundos</span>
        </div>

        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur">
            <header className="mb-8">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Plataforma de Leilão Fantasy
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-white">
                Crie sua Sala de Leilão a partir do Sleeper
              </h1>
              <p className="mt-3 text-lg text-slate-300">
                Importe os times e salary cap automaticamente. Defina a senha
                de administrador e inicie a sala.
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
                  <span>Senha do Administrador (PIN)</span>
                  <span className="text-xs text-slate-400">
                    mínimo 4 caracteres
                  </span>
                </label>
                <input
                  value={adminPasscode}
                  onChange={(event) => setAdminPasscode(event.target.value)}
                  placeholder="Defina um PIN para administrar a sala"
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
                    Criar Sala de Leilão
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          <aside className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-black/60 p-8 shadow-2xl backdrop-blur">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Acesso Simplificado via PIN
              </div>
              <h2 className="text-2xl font-bold text-white">
                Tudo pronto para o seu Leilão
              </h2>
              <p className="text-slate-300">
                Cada gerente define seu próprio PIN de acesso no primeiro login.
                Sem necessidade de cadastro por e-mail ou senhas complexas.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                {
                  title: "Sincronização Sleeper",
                  body: "Importação automática de times, orçamentos e configurações da sua liga.",
                },
                {
                  title: "Segurança e Praticidade",
                  body: "Sistema de autenticação robusto sem complicar a vida dos participantes.",
                },
                {
                  title: "Controle em Tempo Real",
                  body: "Painel administrativo completo para gerenciar o andamento do leilão.",
                },
                {
                  title: "Experiência Premium",
                  body: "Interface escura e moderna, desenhada para longas sessões de draft.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                >
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">{feature.body}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
