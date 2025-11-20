'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const ADMIN_SESSION_COOKIE_NAME = 'admin_session';
const SESSION_EXPIRATION = '7d';

type ActionResult = { success: true } | { success: false; error: string };

export interface AdminSession {
  userId: string;
  name: string;
  email: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET nao configurado');
  }

  return new TextEncoder().encode(secret);
}

async function setAdminSessionCookie(session: AdminSession) {
  const token = await new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION)
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string'
    ) {
      return {
        userId: payload.userId,
        name: typeof payload.name === 'string' ? payload.name : '',
        email: payload.email,
      };
    }
  } catch {
    cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
  }

  return null;
}

export async function registerAdmin(
  name: string,
  email: string,
  password: string
): Promise<ActionResult> {
  try {
    if (!name || !email || !password) {
      return { success: false, error: 'Todos os campos sao obrigatorios' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: 'Email ja cadastrado' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    await setAdminSessionCookie({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro em registerAdmin:', error);
    return { success: false, error: 'Erro ao criar conta' };
  }
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<ActionResult> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email e senha obrigatorios' };
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: 'Credenciais invalidas' };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { success: false, error: 'Credenciais invalidas' };
    }

    await setAdminSessionCookie({
      userId: user.id,
      name: user.name,
      email: user.email,
    });

    return { success: true };
  } catch (error) {
    console.error('Erro em loginAdmin:', error);
    return { success: false, error: 'Erro ao fazer login' };
  }
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}
