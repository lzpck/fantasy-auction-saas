'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'fa_team_session';
const SESSION_EXPIRATION = '7d';

type ActionResult = { success: true } | { success: false; error: string };

export interface TeamSession {
  teamId: string;
  roomId: string;
  ownerName: string | null;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET nao configurado');
  }

  return new TextEncoder().encode(secret);
}

async function setSessionCookie(session: TeamSession) {
  const token = await new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION)
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function getTeamSession(): Promise<TeamSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (
      typeof payload.teamId === 'string' &&
      typeof payload.roomId === 'string'
    ) {
      return {
        teamId: payload.teamId,
        roomId: payload.roomId,
        ownerName:
          typeof payload.ownerName === 'string' ? payload.ownerName : null,
      };
    }
  } catch {
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  return null;
}

export async function claimTeam(
  teamId: string,
  pin: string,
  roomId: string,
): Promise<ActionResult> {
  try {
    if (!/^\d{4}$/.test(pin)) {
      return { success: false, error: 'PIN deve ter 4 digitos' };
    }

    const team = await prisma.auctionTeam.findUnique({
      where: { id: teamId },
    });

    if (!team || team.auctionRoomId !== roomId) {
      return { success: false, error: 'Time nao encontrado' };
    }

    if (team.pinHash) {
      return { success: false, error: 'Time ja possui dono' };
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    await prisma.auctionTeam.update({
      where: { id: teamId },
      data: { pinHash: hashedPin },
    });

    await setSessionCookie({
      teamId,
      roomId,
      ownerName: team.ownerName || null,
    });

    revalidatePath(`/room/${roomId}`);

    return { success: true };
  } catch (error) {
    console.error('Erro em claimTeam:', error);
    return { success: false, error: 'Nao foi possivel reivindicar o time' };
  }
}

export async function loginTeam(
  teamId: string,
  pin: string,
): Promise<ActionResult> {
  try {
    if (!pin) {
      return { success: false, error: 'PIN obrigatorio' };
    }

    const team = await prisma.auctionTeam.findUnique({
      where: { id: teamId },
    });

    if (!team?.pinHash) {
      return {
        success: false,
        error: 'Time nao possui PIN cadastrado',
      };
    }

    const isValid = await bcrypt.compare(pin, team.pinHash);

    if (!isValid) {
      return { success: false, error: 'PIN invalido' };
    }

    await setSessionCookie({
      teamId,
      roomId: team.auctionRoomId,
      ownerName: team.ownerName || null,
    });

    revalidatePath(`/room/${team.auctionRoomId}`);

    return { success: true };
  } catch (error) {
    console.error('Erro em loginTeam:', error);
    return { success: false, error: 'Nao foi possivel autenticar' };
  }
}

export async function logoutTeam(): Promise<ActionResult> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}
