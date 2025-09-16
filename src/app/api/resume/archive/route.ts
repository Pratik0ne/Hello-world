import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';
import { moveResumeToArchive } from '@/lib/gcs/signing';
import { refreshProofScore } from '@/lib/services/candidate';

const schema = z.object({
  resumeId: z.string().cuid(),
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

  const resume = await db.resume.findUnique({ where: { id: parsed.data.resumeId } });
  if (!resume) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const candidate = await db.candidateProfile.findUnique({ where: { id: resume.candidateId } });
  if (!candidate || candidate.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const archivedKey = await moveResumeToArchive(resume.gcsKey);
    await db.resume.update({
      where: { id: resume.id },
      data: { archived: true, gcsKey: archivedKey },
    });
    await refreshProofScore(candidate.id);
    return NextResponse.json({ ok: true, archivedKey });
  } catch (error) {
    console.error('Archive resume failed', error);
    return NextResponse.json({ error: 'Archive failed' }, { status: 500 });
  }
}
