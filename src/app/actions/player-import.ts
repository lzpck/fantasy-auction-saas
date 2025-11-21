'use server';

import { verifyRoomOwnership } from './admin-room';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: boolean;
  count?: number;
  errors?: string[];
}

export async function processPlayerUpload(roomId: string, formData: FormData): Promise<ImportResult> {
  const auth = await verifyRoomOwnership(roomId);
  if (!auth.authorized) return { success: false, errors: ['Não autorizado.'] };

  const file = formData.get('file') as File;
  if (!file) return { success: false, errors: ['Nenhum arquivo enviado.'] };

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, errors: ['O arquivo excede o limite de 5MB.'] };
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    if (jsonData.length < 2) {
      return { success: false, errors: ['O arquivo parece estar vazio ou sem cabeçalho.'] };
    }

    const headers = jsonData[0].map(h => h?.toString().trim().toLowerCase());
    const nameIndex = headers.findIndex(h => h === 'nome' || h === 'player' || h === 'name' || h === 'jogador');
    const posIndex = headers.findIndex(h => h === 'posição' || h === 'posicao' || h === 'pos' || h === 'position');
    const teamIndex = headers.findIndex(h => h === 'time' || h === 'team' || h === 'nfl team');

    if (nameIndex === -1 || posIndex === -1) {
      return { success: false, errors: ['Cabeçalhos obrigatórios não encontrados: "Nome" e "Posição".'] };
    }

    const playersToCreate = [];
    const errors: string[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = row[nameIndex]?.toString().trim();
      const position = row[posIndex]?.toString().trim();
      const nflTeam = teamIndex !== -1 ? row[teamIndex]?.toString().trim() : null;

      if (name && position) {
        playersToCreate.push({
          auctionRoomId: roomId,
          name,
          position,
          nflTeam,
          status: 'PENDING' as const,
        });
      } else if (row.some(cell => cell)) { // Only report error if row is not completely empty
        errors.push(`Linha ${i + 1}: Nome ou Posição faltando.`);
      }
    }

    if (playersToCreate.length > 0) {
      await prisma.auctionItem.createMany({
        data: playersToCreate,
      });
    }

    revalidatePath(`/room/${roomId}/admin`);

    return {
      success: true,
      count: playersToCreate.length,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Error processing upload:', error);
    return { success: false, errors: ['Erro ao processar o arquivo. Verifique se o formato é válido.'] };
  }
}
