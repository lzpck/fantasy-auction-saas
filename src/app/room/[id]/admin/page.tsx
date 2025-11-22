import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/app/actions/admin-auth';
import { AdminRoomDashboard } from '@/components/admin/AdminRoomDashboard';
import { AuctionSettings } from '@/types/auction-settings';

interface AdminPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminRoomPage({ params }: AdminPageProps) {
  const { id } = await params;
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  const room = await prisma.auctionRoom.findUnique({
    where: { id },
    include: {
      teams: {
        orderBy: { name: 'asc' }
      },

    }
  });

  if (!room) {
    notFound();
  }

  if (room.ownerId !== session.userId) {
    // Not the owner
    redirect('/dashboard');
  }

  // Parse settings safely
  let settings: AuctionSettings;
  try {
    settings = JSON.parse(room.settings);
  } catch (e) {
    console.error('Failed to parse room settings', e);
    settings = {} as AuctionSettings; // Should fallback to default or handle error
  }

  return (
    <AdminRoomDashboard 
      roomId={room.id}
      roomName={room.name}
      settings={settings}
      teams={room.teams.map(t => ({
        id: t.id,
        name: t.name,
        budget: t.budget,
        rosterSpots: t.rosterSpots
      }))}

      userName={session.name}
    />
  );
}
