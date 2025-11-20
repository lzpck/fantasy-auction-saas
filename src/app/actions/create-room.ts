'use server';

import { prisma } from '@/lib/prisma';
import { DEFAULT_SETTINGS } from '@/types/auction-settings';

// --- Tipos da API do Sleeper ---

interface SleeperLeague {
  league_id: string;
  name: string;
  total_rosters: number;
  settings?: {
    budget?: number;
    [key: string]: unknown;
  };
  roster_positions?: string[];
}

interface SleeperUser {
  user_id: string;
  display_name: string;
  avatar?: string;
}

interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  players?: string[];
  settings?: {
    wins?: number;
    fpts?: number;
    budget?: number;
    [key: string]: unknown;
  };
}

interface CreateRoomResult {
  success: boolean;
  roomId?: string;
  error?: string;
}

// --- Helpers ---

function validateLeagueId(leagueId: string): boolean {
  return /^\d+$/.test(leagueId);
}

async function fetchSleeperLeague(leagueId: string): Promise<SleeperLeague> {
  const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`, {
    next: { revalidate: 0 }, // nao cachear
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar liga: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchSleeperUsers(leagueId: string): Promise<SleeperUser[]> {
  const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`, {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar usuarios: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchSleeperRosters(leagueId: string): Promise<SleeperRoster[]> {
  const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`, {
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar rosters: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function calculateBudget(roster: SleeperRoster, league: SleeperLeague): number {
  if (roster.settings?.budget) {
    return roster.settings.budget;
  }

  if (league.settings?.budget) {
    return league.settings.budget;
  }

  if (roster.settings?.wins !== undefined) {
    return roster.settings.wins;
  }

  if (roster.settings?.fpts !== undefined) {
    return Math.round(roster.settings.fpts);
  }

  return 1000;
}

function calculateRosterSpots(
  roster: SleeperRoster,
  league: SleeperLeague,
): number {
  const totalSpots = league.roster_positions?.length || DEFAULT_SETTINGS.roster.maxRosterSize;
  const usedSpots = roster.players?.length || 0;
  return Math.max(totalSpots - usedSpots, 0);
}

// --- Main action ---

export async function createRoomFromSleeper(
  sleeperLeagueId: string,
  adminPasscode: string,
): Promise<CreateRoomResult> {
  try {
    if (!sleeperLeagueId || !adminPasscode) {
      return {
        success: false,
        error: 'League ID e senha do admin sao obrigatorios',
      };
    }

    if (!validateLeagueId(sleeperLeagueId)) {
      return {
        success: false,
        error: 'League ID deve ser numerico',
      };
    }

    if (adminPasscode.length < 4) {
      return {
        success: false,
        error: 'Senha do admin deve ter pelo menos 4 caracteres',
      };
    }

    const [league, users, rosters] = await Promise.all([
      fetchSleeperLeague(sleeperLeagueId),
      fetchSleeperUsers(sleeperLeagueId),
      fetchSleeperRosters(sleeperLeagueId),
    ]);

    if (!league || !users || !rosters) {
      return {
        success: false,
        error: 'Dados invalidos retornados da API do Sleeper',
      };
    }

    if (rosters.length === 0) {
      return {
        success: false,
        error: 'Liga nao possui rosters',
      };
    }

    const userMap = new Map<string, SleeperUser>();
    users.forEach((user) => {
      userMap.set(user.user_id, user);
    });

    const teamsData = rosters.map((roster) => {
      const owner = userMap.get(roster.owner_id);
      const budget = calculateBudget(roster, league);
      const rosterSpots = calculateRosterSpots(roster, league);

      return {
        name: owner?.display_name || `Team ${roster.roster_id}`,
        ownerName: owner?.display_name || null,
        sleeperOwnerId: roster.owner_id,
        budget,
        rosterSpots,
        pinHash: null, // definido pelo usuario depois
      };
    });

    const room = await prisma.auctionRoom.create({
      data: {
        name: league.name || `Sleeper League ${sleeperLeagueId}`,
        passcode: adminPasscode,
        sleeperId: sleeperLeagueId,
        status: 'DRAFT',
        settings: JSON.stringify(DEFAULT_SETTINGS),
        teams: {
          create: teamsData,
        },
      },
      include: {
        teams: true,
      },
    });

    return {
      success: true,
      roomId: room.id,
    };
  } catch (error) {
    console.error('Erro ao criar sala do Sleeper:', error);

    let errorMessage = 'Erro desconhecido ao criar sala';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    if (errorMessage.includes('404')) {
      errorMessage = 'Liga nao encontrada no Sleeper';
    } else if (errorMessage.includes('Falha ao buscar')) {
      errorMessage = 'Erro ao comunicar com a API do Sleeper';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
