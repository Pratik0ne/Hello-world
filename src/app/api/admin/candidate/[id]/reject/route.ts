import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';

const schema = z.object({ message: z.string().min(10).max(500) });

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.candidateProfile.update({
      where: { id: params.id },
      data: { status: 'REJECTED' },
    });
    await tx.reviewNote.create({
      data: {
        candidateId: params.id,
        reviewerId: session.user.id,
        message: parsed.data.message,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
