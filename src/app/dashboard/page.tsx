import { getAdminSession, logoutAdmin } from '@/app/actions/admin-auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateRoomForm } from '@/components/dashboard/CreateRoomForm';
import { LogOut, Settings, ExternalLink } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/login');
  }

  const rooms = await prisma.auctionRoom.findMany({
    where: {
      ownerId: session.userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      _count: {
        select: { teams: true },
      },
    },
  });

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
              Olá, {session.name}
            </span>
            <form action={logoutAdmin}>
              <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5 transition">
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            <header>
              <h1 className="text-3xl font-bold">Minhas Salas</h1>
              <p className="mt-2 text-slate-400">
                Gerencie seus leilões e configurações.
              </p>
            </header>

            <div className="grid gap-6">
              {rooms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
                  <p className="text-slate-400">
                    Você ainda não criou nenhuma sala.
                  </p>
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition hover:border-sky-500/50 hover:bg-slate-900"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {room.name}
                        </h3>
                        <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                            {room.status}
                          </span>
                          <span>{room._count.teams} times</span>
                          <span>ID: {room.sleeperId}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/room/${room.id}`}
                          className="flex items-center gap-2 rounded-lg bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-400 transition hover:bg-sky-500/20"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Entrar
                        </Link>
                        <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5">
                          <Settings className="h-4 w-4" />
                          Configurar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <aside>
            <div className="sticky top-8">
              <CreateRoomForm />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
