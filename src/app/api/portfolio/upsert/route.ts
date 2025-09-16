import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';
import { ensureCandidate, refreshProofScore } from '@/lib/services/candidate';

const schema = z.object({
  kaggleUrl: z.string().url().optional().or(z.literal('')),
  blogUrl: z.string().url().optional().or(z.literal('')),
  siteUrl: z.string().url().optional().or(z.literal('')),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const candidate = await ensureCandidate(session.user.id);

  const data = parsed.data;
  await db.portfolio.upsert({
    where: { candidateId: candidate.id },
    update: {
      kaggleUrl: data.kaggleUrl || null,
      blogUrl: data.blogUrl || null,
      siteUrl: data.siteUrl || null,
    },
    create: {
      candidateId: candidate.id,
      kaggleUrl: data.kaggleUrl || null,
      blogUrl: data.blogUrl || null,
      siteUrl: data.siteUrl || null,
    },
  });
  await refreshProofScore(candidate.id);

  return NextResponse.json({ ok: true });
}
