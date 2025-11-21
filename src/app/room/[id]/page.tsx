import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getTeamSession } from '@/app/actions/auth';
import { getAdminSession } from '@/app/actions/admin-auth';
import TeamGrid, { TeamCardData } from './team-grid';
import { AuctionRoomClient } from '@/components/auction/AuctionRoomClient';

function formatStatus(status: string) {
  const labelMap: Record<string, string> = {
    DRAFT: 'Rascunho',
    OPEN: 'Aberta',
    PAUSED: 'Pausada',
    COMPLETED: 'Concluida',
  };

  return labelMap[status] || status;
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [room, teamSession, adminSession] = await Promise.all([
    prisma.auctionRoom.findUnique({
      where: { id },
      include: { teams: true },
    }),
    getTeamSession(),
    getAdminSession(),
  ]);

  if (!room) {
    notFound();
  }

  const isOwner = adminSession?.userId === room.ownerId;

  if (teamSession && teamSession.roomId === id) {
    return <AuctionRoomClient roomId={id} isOwner={isOwner} />;
  }

  const teams: TeamCardData[] = room.teams.map((team) => ({
    id: team.id,
    name: team.name,
    ownerName: team.ownerName,
    budget: Number(team.budget),
    rosterSpots: team.rosterSpots,
    pinHash: team.pinHash,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
              Auction Room
            </p>
            <h1 className="mt-1 text-3xl font-black lg:text-4xl">{room.name}</h1>
            <p className="text-slate-400">
              Importada do Sleeper • {room.teams.length} times
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
            {formatStatus(room.status || 'DRAFT')}
          </div>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Lobby dos Times</h2>
              <p className="text-sm text-slate-400">
                Reivindique seu time com PIN ou faça login para continuar.
              </p>
            </div>
            {teamSession && (
              <div className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                Sessao ativa
              </div>
            )}
          </div>

          <TeamGrid roomId={id} teams={teams} session={teamSession} />
        </div>
      </div>
    </div>
  );
}
