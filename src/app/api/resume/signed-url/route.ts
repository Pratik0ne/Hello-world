import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';
import { generateResumeUploadUrl, virusScanStub, moveResumeToArchive } from '@/lib/gcs/signing';
import { ensureCandidate, refreshProofScore } from '@/lib/services/candidate';

const schema = z.object({
  fileType: z
    .string()
    .refine((value) =>
      ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'].includes(value)
    ),
  fileSize: z.number().max(10 * 1024 * 1024),
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
  const { fileType } = parsed.data;
  const candidate = await ensureCandidate(session.user.id);

  const previousResumes = await db.resume.findMany({ where: { candidateId: candidate.id, archived: false } });
  await Promise.all(
    previousResumes.map(async (resume) => {
      try {
        const archivedKey = await moveResumeToArchive(resume.gcsKey);
        await db.resume.update({
          where: { id: resume.id },
          data: { archived: true, gcsKey: archivedKey },
        });
      } catch (error) {
        console.error('Failed to archive resume', error);
      }
    })
  );

  const signed = await generateResumeUploadUrl(candidate.id, fileType);
  const resume = await db.resume.create({
    data: {
      candidateId: candidate.id,
      gcsKey: signed.gcsKey,
      fileType,
      archived: false,
    },
  });
  await refreshProofScore(candidate.id);
  await virusScanStub(signed.gcsKey);

  return NextResponse.json({
    uploadUrl: signed.url,
    gcsKey: signed.gcsKey,
    resumeId: resume.id,
    expiresAt: signed.expiresAt.toISOString(),
  });
}
