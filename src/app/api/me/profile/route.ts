import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';
import { ensureCandidate, refreshProofScore } from '@/lib/services/candidate';

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z
    .string()
    .regex(/^(\+91)?[6-9][0-9]{9}$/)
    .optional(),
  yearsExp: z.number().int().min(0).max(50).optional(),
  primaryCloud: z.enum(['GCP', 'AWS', 'Azure']).optional(),
  tools: z.array(z.string().max(40)).max(20).optional(),
  submit: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const candidate = await ensureCandidate(session.user.id);
  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
    candidate,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const data = parse.data;
  const candidate = await ensureCandidate(session.user.id);

  await db.$transaction(async (tx) => {
    if (data.name) {
      await tx.user.update({ where: { id: session.user.id }, data: { name: data.name } });
    }
    await tx.candidateProfile.update({
      where: { id: candidate.id },
      data: {
        phone: data.phone ?? candidate.phone,
        yearsExp: data.yearsExp ?? candidate.yearsExp,
        primaryCloud: data.primaryCloud ?? candidate.primaryCloud,
        tools: data.tools ?? candidate.tools,
        status: data.submit && candidate.status !== 'VERIFIED' ? 'SUBMITTED' : candidate.status,
      },
    });
  });

  await refreshProofScore(candidate.id);
  const updated = await db.candidateProfile.findUnique({
    where: { id: candidate.id },
    include: { resumes: true, portfolio: true, referee: true },
  });

  return NextResponse.json({
    ok: true,
    candidate: updated,
  });
}
