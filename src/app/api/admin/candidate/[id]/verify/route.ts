import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';

const schema = z.object({ message: z.string().max(500).optional() });

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const candidate = await db.candidateProfile.update({
    where: { id: params.id },
    data: { status: 'VERIFIED' },
  });
  if (parsed.data.message) {
    await db.reviewNote.create({
      data: {
        candidateId: candidate.id,
        reviewerId: session.user.id,
        message: parsed.data.message,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
