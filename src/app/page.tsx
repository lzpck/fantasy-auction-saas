import Link from "next/link";
import { Gavel, ArrowRight, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-900 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.08),transparent_35%)]" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-400" />
          <span className="text-lg font-bold">War Room Fantasy</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Criar Conta
          </Link>
        </div>
      </nav>

      <div className="relative mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
          <Gavel className="h-4 w-4 text-sky-300" />
          <span>O seu War Room definitivo</span>
        </div>

        <h1 className="mb-6 text-5xl font-black leading-tight text-white md:text-7xl">
          Domine o seu <br />
          <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Auction Draft
          </span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-slate-300 md:text-xl">
          Transforme seu draft em uma verdadeira sala de guerra. Importe sua liga
          do Sleeper, gerencie orçamentos e dispute jogadores em leilões em tempo
          real.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-400 px-8 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition hover:scale-105 hover:shadow-sky-500/30"
          >
            Começar Agora
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
          >
            Já tenho conta
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 text-left md:grid-cols-3">
          {[
            {
              title: "Integração Sleeper",
              body: "Importe times, rosters e configurações da sua liga em segundos.",
            },
            {
              title: "Acesso Rápido",
              body: "Seus amigos entram na sala apenas com um PIN, sem cadastro.",
            },
            {
              title: "Comando Central",
              body: "Ferramentas completas para o comissário gerenciar o War Room.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <ShieldCheck className="mb-4 h-8 w-8 text-sky-400" />
              <h3 className="mb-2 text-lg font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
