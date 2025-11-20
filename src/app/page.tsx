"use client";

import { useState } from "react";

type TabKey = "schema" | "types" | "seed";

const schemaCode = `// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // ou "postgresql" para producao
  url      = env("DATABASE_URL")
}

// --- ENUMS ---

enum RoomStatus {
  DRAFT
  OPEN
  PAUSED
  COMPLETED
}

enum PlayerStatus {
  PENDING
  NOMINATED
  SOLD
  UNSOLD
}

enum BidStatus {
  VALID
  RETRACTED // status util para a regra de "retirar lance" sem multa
  VOID      // lances invalidados tecnicamente
}

enum NotificationType {
  OUTBID
  WINNER_RESTORED // quando alguem retira o lance e voce volta a ganhar
  AUCTION_WON
  SYSTEM
}

// --- MODELS ---

model AuctionRoom {
  id        String     @id @default(cuid())
  name      String
  passcode  String     // senha do admin/comissario
  sleeperId String?    // ID da liga no Sleeper (opcional)
  status    RoomStatus @default(DRAFT)
  
  // Configuracoes tipadas em src/types/auction-settings.ts
  settings  String     // persistido como JSON stringificado para compatibilidade SQLite
  
  teams     AuctionTeam[]
  items     AuctionItem[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuctionTeam {
  id             String   @id @default(cuid())
  auctionRoomId  String
  
  name           String
  ownerName      String?  // nome do dono no Sleeper ou manual
  sleeperOwnerId String?  // ID do usuario no Sleeper (para avatar/sync)
  
  // Economia
  budget       Float    // Salary Cap ou FAAB disponivel inicial
  rosterSpots  Int      // vagas totais disponiveis

  // Seguranca (PIN de acesso)
  pinHash      String?  // se null, time ainda nao foi reivindicado
  
  auctionRoom   AuctionRoom @relation(fields: [auctionRoomId], references: [id], onDelete: Cascade)
  bids          Bid[]
  notifications Notification[]

  @@index([auctionRoomId])
}

model AuctionItem {
  id            String       @id @default(cuid())
  auctionRoomId String
  
  name          String
  position      String
  nflTeam       String?      // ex: "KC", "BUF"
  
  status        PlayerStatus @default(PENDING)
  
  // Resultado do leilao
  winningBidId  String?      @unique
  winningTeamId String?
  contractYears Int?         // calculado ao fechar o leilao
  
  auctionRoom   AuctionRoom  @relation(fields: [auctionRoomId], references: [id], onDelete: Cascade)
  bids          Bid[]

  @@index([auctionRoomId])
}

model Bid {
  id            String    @id @default(cuid())
  auctionItemId String
  teamId        String
  
  amount        Float
  timestamp     DateTime  @default(now())
  status        BidStatus @default(VALID)

  auctionItem   AuctionItem @relation(fields: [auctionItemId], references: [id], onDelete: Cascade)
  team          AuctionTeam @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  // Relacao inversa para saber se este bid foi o vencedor
  wonItem       AuctionItem? @relation("BidWonItem")

  @@index([auctionItemId])
  @@index([teamId])
}

model Notification {
  id        String           @id @default(cuid())
  teamId    String
  type      NotificationType
  message   String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
  
  // Metadados opcionais para navegacao (ex: clicar na notif e ir ate o jogador)
  relatedItemId String?

  team      AuctionTeam @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@index([teamId, isRead]) // indice otimizado para o "Smart Polling"
}`;

const typesCode = `// src/types/auction-settings.ts
export type BudgetType = 'SALARY_CAP' | 'FAAB';

export interface ContractRule {
  minBid: number;    // valor minimo do lance para aplicar esta regra
  maxBid?: number;   // valor maximo (opcional, se for o ultimo tier acima eh infinito)
  years: number;     // duracao do contrato gerado
}

export interface RosterSettings {
  maxRosterSize: number;
  positions?: Record<string, number>; // ex: { "QB": 2, "RB": 4 }
}

export interface AuctionSettings {
  budgetType: BudgetType;
  startingBudget: number;
  
  // Logica de contratos dinamicos
  contractLogic: {
    enabled: boolean;
    rules: ContractRule[];
  };
  
  roster: RosterSettings;
  
  // Regras de lance
  minIncrement: number; // ex: 1 ($) ou porcentagem
  timerSeconds: number; // tempo do relogio de leilao
}

// Configuracao "The Bad Place" para teste
export const DEFAULT_SETTINGS: AuctionSettings = {
  budgetType: 'SALARY_CAP',
  startingBudget: 1000,
  contractLogic: {
    enabled: true,
    rules: [
      { minBid: 1, maxBid: 9, years: 1 },
      { minBid: 10, maxBid: 49, years: 2 },
      { minBid: 50, maxBid: 99, years: 3 },
      { minBid: 100, years: 4 }
    ]
  },
  roster: {
    maxRosterSize: 20
  },
  minIncrement: 1,
  timerSeconds: 30
};`;

const seedCode = `// prisma/seed.ts
import { PlayerStatus, PrismaClient, RoomStatus } from '@prisma/client';
import { DEFAULT_SETTINGS } from '../src/types/auction-settings';

const prisma = new PrismaClient();

// simulacao simples de hash (em producao, use bcrypt ou argon2)
const simpleHash = (pin: string) => \`hashed_\${pin}\`;

async function main() {
  console.log('[seed] Iniciando seed do banco de dados...');

  const settingsJson = JSON.stringify(DEFAULT_SETTINGS);

  const room = await prisma.auctionRoom.create({
    data: {
      name: 'The Bad Place - League 1',
      passcode: 'admin123', // senha do comissario para criar/pausar
      status: RoomStatus.OPEN,
      settings: settingsJson,
    },
  });

  console.log(\`[seed] Sala criada: \${room.name} (ID: \${room.id})\`);

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

  console.log(\`[seed] Times criados: \${teams.map((team) => team.name).join(' e ')}\`);

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

  console.log(\`[seed] \${players.length} jogadores adicionados ao pool.\`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });`;

function CodeBlock({
  title,
  code,
  language = "typescript",
}: {
  title: string;
  code: string;
  language?: string;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2">
        <span className="font-mono text-sm font-semibold text-slate-700">{title}</span>
        <span className="text-xs uppercase text-slate-500">{language}</span>
      </div>
      <pre className="bg-slate-900 p-4 text-sm leading-relaxed text-slate-50 overflow-x-auto whitespace-pre" aria-label={title}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("schema");

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white shadow-lg">
              FA
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Fantasy Auction SaaS</h1>
              <p className="text-lg text-slate-600">Arquitetura do App Router com Prisma e tipagem de configuracoes.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <nav className="space-y-2 lg:col-span-1">
            {(
              [
                { key: "schema" as const, label: "Prisma Schema" },
                { key: "types" as const, label: "TypeScript Settings" },
                { key: "seed" as const, label: "Seed Script" },
              ] satisfies { key: TabKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full rounded-md px-4 py-3 text-left font-medium transition-all ${
                  activeTab === key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <main className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {activeTab === "schema" && (
              <div>
                <h3 className="mb-4 text-xl font-bold">Estrutura do banco de dados</h3>
                <p className="mb-4 text-slate-600">
                  O arquivo <code className="rounded bg-slate-100 px-1 py-0.5 text-sm text-blue-700">schema.prisma</code> define a espinha dorsal do sistema.
                </p>
                <ul className="mb-6 list-inside list-disc space-y-2 text-slate-700">
                  <li><strong>AuctionRoom:</strong> campo <code className="bg-slate-100 p-1 text-sm font-mono">settings</code> guarda as regras em JSON tipadas.</li>
                  <li><strong>AuctionTeam:</strong> usa <code className="bg-slate-100 p-1 text-sm font-mono">pinHash</code> (login via PIN) e <code className="bg-slate-100 p-1 text-sm font-mono">rosterSpots</code> para controle de vagas.</li>
                  <li><strong>Bid:</strong> permite status <code className="bg-slate-100 p-1 text-sm font-mono">RETRACTED</code> para suportar retirada sem multa.</li>
                </ul>
                <CodeBlock title="prisma/schema.prisma" code={schemaCode} language="prisma" />
              </div>
            )}

            {activeTab === "types" && (
              <div>
                <h3 className="mb-4 text-xl font-bold">Tipagem das configuracoes</h3>
                <p className="mb-4 text-slate-600">
                  Interfaces TypeScript que descrevem budget, contratos dinamicos e regras de lance em <code className="rounded bg-slate-100 px-1 py-0.5 text-sm text-blue-700">src/types/auction-settings.ts</code>.
                </p>
                <CodeBlock title="src/types/auction-settings.ts" code={typesCode} />
              </div>
            )}

            {activeTab === "seed" && (
              <div>
                <h3 className="mb-4 text-xl font-bold">Script de seed</h3>
                <p className="mb-4 text-slate-600">
                  Popula uma liga teste com PIN de admin, times e jogadores para rodar fluxos rapidamente.
                </p>
                <CodeBlock title="prisma/seed.ts" code={seedCode} language="typescript" />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
