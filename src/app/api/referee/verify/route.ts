import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/prisma';
import { hashToken } from '@/lib/utils/hash';
import { refreshProofScore } from '@/lib/services/candidate';

const schema = z.object({ token: z.string().min(16) });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({ token: searchParams.get('token') });
  if (!parsed.success || !parsed.data.token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }
  const hashed = hashToken(parsed.data.token);
  const referee = await db.referee.findFirst({ where: { tokenHash: hashed } });
  if (!referee) {
    return NextResponse.json({ error: 'Token expired' }, { status: 404 });
  }
  await db.referee.update({ where: { id: referee.id }, data: { verifiedAt: new Date() } });
  await refreshProofScore(referee.candidateId);
  return NextResponse.json({ ok: true });
}
