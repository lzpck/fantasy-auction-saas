import React, { useState } from 'react';

// Components
const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-4 border-b pb-2">{title}</h2>
);

const CodeBlock = ({ title, code, language = 'typescript' }: { title: string; code: string; language?: string }) => (
  <div className="mb-6 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
      <span className="font-mono text-sm text-slate-600 font-semibold">{title}</span>
      <span className="text-xs text-slate-500 uppercase">{language}</span>
    </div>
    <pre className="bg-slate-900 text-slate-50 p-4 overflow-x-auto text-sm leading-relaxed">
      <code>{code}</code>
    </pre>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'schema' | 'types' | 'seed'>('schema');

  const schemaCode = `// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // ou "sqlite" para dev local
  url      = env("DATABASE_URL")
}

// Enums para controle de estado
enum RoomStatus {
  DRAFT
  OPEN
  PAUSED
  COMPLETED
}

enum ItemStatus {
  PENDING   // Ainda não nomeado
  NOMINATED // Atualmente em leilão
  SOLD      // Vendido
  UNSOLD    // Passou sem lances
}

enum BidStatus {
  VALID
  RETRACTED // Lance retirado (retorna ao anterior)
  VOID      // Invalidado por um lance maior (opcional, histórico)
}

enum NotificationType {
  OUTBID
  WINNER_RESTORED
  AUCTION_STARTED
  AUCTION_PAUSED
  ITEM_SOLD
}

// 1. A Entidade Raiz: Sala de Leilão
model AuctionRoom {
  id        String   @id @default(cuid())
  name      String
  passcode  String   // Senha mestre do Admin/Comissário
  status    RoomStatus @default(DRAFT)
  
  // Armazena JSON.stringified de AuctionSettings (ver tipos)
  // Flexibilidade para Salary Cap, Contratos, etc.
  settings  String   
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  teams     AuctionTeam[]
  items     AuctionItem[]
}

// 2. O Time (General Manager)
model AuctionTeam {
  id          String   @id @default(cuid())
  name        String
  ownerName   String?
  
  // Autenticação sem e-mail. Hash do PIN de 4 dígitos.
  // Null até o time ser "reivindicado" pelo usuário.
  pinHash     String?  
  
  budget      Int      @default(200) // Salário Cap inicial (ex: $200 ou $1000)
  spots       Int      @default(0)   // Vagas ocupadas no elenco
  
  roomId      String
  room        AuctionRoom @relation(fields: [roomId], references: [id])

  bids        Bid[]
  notifications Notification[]
}

// 3. O Item (Jogador da NFL)
model AuctionItem {
  id          String   @id @default(cuid())
  name        String
  position    String   // QB, RB, WR, TE, etc.
  nflTeam     String?  // Ex: SF, KC
  status      ItemStatus @default(PENDING)
  
  roomId      String
  room        AuctionRoom @relation(fields: [roomId], references: [id])

  // Resultado Final
  winningBidId String? @unique
  winningBid   Bid?    @relation("WinningBid", fields: [winningBidId], references: [id])
  
  // Histórico de lances neste item
  bids         Bid[]   @relation("ItemBids")
}

// 4. O Lance
model Bid {
  id          String   @id @default(cuid())
  amount      Int
  timestamp   DateTime @default(now())
  status      BidStatus @default(VALID)

  teamId      String
  team        AuctionTeam @relation(fields: [teamId], references: [id])

  itemId      String
  item        AuctionItem @relation("ItemBids", fields: [itemId], references: [id])

  // Relação inversa para definir o vencedor no Item
  winningItem AuctionItem? @relation("WinningBid")
}

// 5. Notificações (Efêmeras)
model Notification {
  id        String   @id @default(cuid())
  message   String
  type      NotificationType
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  teamId    String
  team      AuctionTeam @relation(fields: [teamId], references: [id])
}`;

  const typesCode = `// src/types/auction-settings.ts

export type BudgetType = 'SALARY_CAP' | 'FAAB';

export interface ContractRule {
  minBid: number;    // Valor mínimo do lance para aplicar esta regra
  maxBid?: number;   // Valor máximo (opcional, se for o último tier é infinito)
  years: number;     // Duração do contrato gerado
}

export interface RosterSettings {
  maxRosterSize: number;
  positions?: Record<string, number>; // Opcional: limites por posição (QB: 2)
}

export interface AuctionSettings {
  budgetType: BudgetType;
  startingBudget: number;
  
  // Configuração de Contratos Dinâmicos
  contractLogic: {
    enabled: boolean;
    rules: ContractRule[];
  };
  
  roster: RosterSettings;
  
  // Regras de Lance
  minIncrement: number; // Ex: 1 ($)
  timerSeconds: number; // Ex: 30 segundos para contagem regressiva
}

// Exemplo de Configuração Padrão ("The Bad Place")
export const DEFAULT_SETTINGS: AuctionSettings = {
  budgetType: 'SALARY_CAP',
  startingBudget: 1000,
  contractLogic: {
    enabled: true,
    rules: [
      { minBid: 1, maxBid: 9, years: 1 },
      { minBid: 10, maxBid: 49, years: 2 },
      { minBid: 50, maxBid: 99, years: 3 },
      { minBid: 100, years: 4 } // 100+ = 4 anos
    ]
  },
  roster: {
    maxRosterSize: 20
  },
  minIncrement: 1,
  timerSeconds: 30
};`;

  const seedCode = `// prisma/seed.ts

import { PrismaClient, RoomStatus } from '@prisma/client';
import { DEFAULT_SETTINGS } from '../src/types/auction-settings';

const prisma = new PrismaClient();

// Simulação simples de hash para o seed (em prod use bcrypt)
const simpleHash = (pin: string) => \`hashed_\${pin}\`; 

async function main() {
  console.log('🌱 Iniciando Seed do Banco de Dados...');

  // 1. Criar Sala de Teste
  const settingsJson = JSON.stringify(DEFAULT_SETTINGS);
  
  const room = await prisma.auctionRoom.create({
    data: {
      name: "The Bad Place - League 1",
      passcode: "admin123", // Senha do comissário
      status: RoomStatus.OPEN,
      settings: settingsJson,
    }
  });

  console.log(\`🏠 Sala criada: \${room.name} (ID: \${room.id})\`);

  // 2. Criar Times
  const team1 = await prisma.auctionTeam.create({
    data: {
      name: "Team Michael",
      ownerName: "Michael",
      pinHash: simpleHash("1234"), // PIN: 1234
      budget: DEFAULT_SETTINGS.startingBudget,
      spots: 0,
      roomId: room.id
    }
  });

  const team2 = await prisma.auctionTeam.create({
    data: {
      name: "Team Eleanor",
      ownerName: "Eleanor",
      pinHash: simpleHash("9999"), // PIN: 9999
      budget: DEFAULT_SETTINGS.startingBudget,
      spots: 0,
      roomId: room.id
    }
  });

  console.log(\`👥 Times criados: \${team1.name} e \${team2.name}\`);

  // 3. Criar Jogadores (Items)
  const players = [
    { name: "Patrick Mahomes", position: "QB", nflTeam: "KC" },
    { name: "Justin Jefferson", position: "WR", nflTeam: "MIN" },
    { name: "Christian McCaffrey", position: "RB", nflTeam: "SF" },
    { name: "Travis Kelce", position: "TE", nflTeam: "KC" },
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

  console.log(\`🏈 \${players.length} jogadores adicionados ao pool.\`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
               FA
             </div>
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fantasy Auction SaaS</h1>
          </div>
          <p className="text-lg text-slate-600">
            Arquitetura de Banco de Dados e Definição de Tipos.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <nav className="lg:col-span-1 space-y-2">
            <button
              onClick={() => setActiveTab('schema')}
              className={`w-full text-left px-4 py-3 rounded-md transition-all font-medium ${
                activeTab === 'schema' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Prisma Schema
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`w-full text-left px-4 py-3 rounded-md transition-all font-medium ${
                activeTab === 'types' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              TypeScript Settings
            </button>
            <button
              onClick={() => setActiveTab('seed')}
              className={`w-full text-left px-4 py-3 rounded-md transition-all font-medium ${
                activeTab === 'seed' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              Seed Script
            </button>
          </nav>

          <main className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            {activeTab === 'schema' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Estrutura do Banco de Dados</h3>
                <p className="mb-4 text-slate-600">
                  O arquivo <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600 text-sm">schema.prisma</code> define a espinha dorsal do sistema. 
                  Pontos chave:
                </p>
                <ul className="list-disc list-inside mb-6 text-slate-700 space-y-2">
                  <li><strong>AuctionRoom:</strong> Contém o campo <code className="text-sm font-mono bg-slate-100 p-1">settings</code> (JSON) para flexibilidade máxima de regras.</li>
                  <li><strong>AuctionTeam:</strong> Usa <code className="text-sm font-mono bg-slate-100 p-1">pinHash</code> em vez de email/senha.</li>
                  <li><strong>Bid:</strong> Possui status <code className="text-sm font-mono bg-slate-100 p-1">RETRACTED</code> para lógica de cancelamento sem penalidade.</li>
                </ul>
                <CodeBlock title="prisma/schema.prisma" code={schemaCode} language="prisma" />
              </div>
            )}

            {activeTab === 'types' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Tipagem de Configurações</h3>
                <p className="mb-4 text-slate-600">
                  Definições TypeScript para garantir a integridade dos dados no campo JSON.
                </p>
                <CodeBlock title="src/types/auction-settings.ts" code={typesCode} />
              </div>
            )}

            {activeTab === 'seed' && (
              <div>
                <h3 className="text-xl font-bold mb-4">Script de Inicialização (Seed)</h3>
                <p className="mb-4 text-slate-600">
                  Cria uma sala de teste pronta para uso com regras de contrato pré-configuradas.
                </p>
                <CodeBlock title="prisma/seed.ts" code={seedCode} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}