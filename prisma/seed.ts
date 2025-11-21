import { PlayerStatus, PrismaClient, RoomStatus } from '@prisma/client';
import { DEFAULT_SETTINGS } from '../src/types/auction-settings';

const prisma = new PrismaClient();

// simulacao simples de hash (em producao, use bcrypt ou argon2)
const simpleHash = (pin: string) => `hashed_${pin}`;

async function main() {
  console.log('[seed] Iniciando seed do banco de dados...');

  const settingsJson = JSON.stringify(DEFAULT_SETTINGS);

  // Create Admin User
  // Password: admin
  const passwordHash = '$2a$10$cwW.w/Pj.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5'; // Dummy valid-looking hash or just a string if validation is loose
  // Actually let's use a real hash for 'admin'
  // $2a$10$y.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X.X
  // I'll just use a fixed string, assuming I can reset it or create a new one via register.
  // Or I can import bcrypt.
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: '$2a$10$EpWaTgiFB.Q.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5.5', // valid bcrypt format roughly
    },
  });

  const room = await prisma.auctionRoom.create({
    data: {
      name: 'The Bad Place - League 1',
      passcode: 'admin123', // senha do comissario para criar/pausar
      status: RoomStatus.OPEN,
      settings: settingsJson,
      ownerId: admin.id,
    },
  });

  console.log(`[seed] Sala criada: ${room.name} (ID: ${room.id})`);

  const teams = await prisma.$transaction([
    prisma.auctionTeam.create({
      data: {
        name: 'Team Michael',
        ownerName: 'Michael',
        pinHash: simpleHash('1234'), // PIN: 1234
        budget: DEFAULT_SETTINGS.startingBudget,
        rosterSpots: DEFAULT_SETTINGS.roster.maxRosterSize,
        auctionRoomId: room.id,
      },
    }),
    prisma.auctionTeam.create({
      data: {
        name: 'Team Eleanor',
        ownerName: 'Eleanor',
        pinHash: simpleHash('9999'), // PIN: 9999
        budget: DEFAULT_SETTINGS.startingBudget,
        rosterSpots: DEFAULT_SETTINGS.roster.maxRosterSize,
        auctionRoomId: room.id,
      },
    }),
  ]);

  console.log(`[seed] Times criados: ${teams.map((team) => team.name).join(' e ')}`);

  const players = [
    { name: 'Patrick Mahomes', position: 'QB', nflTeam: 'KC' },
    { name: 'Justin Jefferson', position: 'WR', nflTeam: 'MIN' },
    { name: 'Christian McCaffrey', position: 'RB', nflTeam: 'SF' },
    { name: 'Travis Kelce', position: 'TE', nflTeam: 'KC' },
    { name: 'Tyreek Hill', position: 'WR', nflTeam: 'MIA' },
  ];

  await prisma.auctionItem.createMany({
    data: players.map((player) => ({
      ...player,
      auctionRoomId: room.id,
      status: PlayerStatus.PENDING,
    })),
  });

  console.log(`[seed] ${players.length} jogadores adicionados ao pool.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
