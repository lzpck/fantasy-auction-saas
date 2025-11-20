import { PrismaClient, RoomStatus } from '@prisma/client';
import { DEFAULT_SETTINGS } from '../src/types/auction-settings';

const prisma = new PrismaClient();

// Simulação simples de hash (em produção, use bcrypt ou argon2)
const simpleHash = (pin: string) => `hashed_${pin}`; 

async function main() {
  console.log('🌱 Iniciando Seed do Banco de Dados...');

  // 1. Criar Sala de Teste
  const settingsJson = JSON.stringify(DEFAULT_SETTINGS);
  
  const room = await prisma.auctionRoom.create({
    data: {
      name: "The Bad Place - League 1",
      passcode: "admin123", // Senha do comissário para criar/pausar
      status: RoomStatus.OPEN,
      settings: settingsJson,
    }
  });

  console.log(`🏠 Sala criada: ${room.name} (ID: ${room.id})`);

  // 2. Criar Times
  // Team Michael
  const team1 = await prisma.auctionTeam.create({
    data: {
      name: "Team Michael",
      ownerName: "Michael",
      pinHash: simpleHash("1234"), // User PIN: 1234
      budget: DEFAULT_SETTINGS.startingBudget,
      spots: 0,
      roomId: room.id
    }
  });

  // Team Eleanor
  const team2 = await prisma.auctionTeam.create({
    data: {
      name: "Team Eleanor",
      ownerName: "Eleanor",
      pinHash: simpleHash("9999"), // User PIN: 9999
      budget: DEFAULT_SETTINGS.startingBudget,
      spots: 0,
      roomId: room.id
    }
  });

  console.log(`👥 Times criados: ${team1.name} e ${team2.name}`);

  // 3. Criar Jogadores (Items)
  const players = [
    { name: "Patrick Mahomes", position: "QB", nflTeam: "KC" },
    { name: "Justin Jefferson", position: "WR", nflTeam: "MIN" },
    { name: "Christian McCaffrey", position: "RB", nflTeam: "SF" },
    { name: "Travis Kelce", position: "TE", nflTeam: "KC" },
    { name: "Tyreek Hill", position: "WR", nflTeam: "MIA" },
  ];

  for (const p of players) {
    await prisma.auctionItem.create({
      data: {
        ...p,
        roomId: room.id,
        status: 'PENDING'
      }
    });
  }

  console.log(`🏈 ${players.length} jogadores adicionados ao pool.`);
}

main()
  .catch((e) => {
    console.error(e);
    // Fix: Cast process to any to avoid TypeScript error about missing exit method on Process type
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });