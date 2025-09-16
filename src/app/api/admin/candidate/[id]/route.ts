import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';
import { generateResumeDownloadUrl } from '@/lib/gcs/signing';

type Params = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'REVIEWER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const candidate = await db.candidateProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      resumes: { orderBy: { uploadedAt: 'desc' } },
      portfolio: true,
      referee: true,
      reviewNotes: { orderBy: { createdAt: 'desc' }, include: { reviewer: true } },
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const resumes = await Promise.all(
    candidate.resumes.map(async (resume) => {
      try {
        const signed = await generateResumeDownloadUrl(resume.gcsKey);
        return {
          id: resume.id,
          gcsKey: resume.gcsKey,
          archived: resume.archived,
          fileType: resume.fileType,
          uploadedAt: resume.uploadedAt,
          downloadUrl: signed.url,
          expiresAt: signed.expiresAt.toISOString(),
        };
      } catch (error) {
        console.error('Signed URL error', error);
        return {
          id: resume.id,
          gcsKey: resume.gcsKey,
          archived: resume.archived,
          fileType: resume.fileType,
          uploadedAt: resume.uploadedAt,
        };
      }
    })
  );

  return NextResponse.json({
    candidate: {
      id: candidate.id,
      name: candidate.user?.name,
      email: candidate.user?.email,
      phone: candidate.phone,
      yearsExp: candidate.yearsExp,
      primaryCloud: candidate.primaryCloud,
      tools: candidate.tools,
      status: candidate.status,
      proofScore: candidate.proofScore,
      portfolio: candidate.portfolio,
      referee: candidate.referee,
      reviewNotes: candidate.reviewNotes.map((note) => ({
        id: note.id,
        message: note.message,
        createdAt: note.createdAt,
        reviewer: {
          id: note.reviewerId,
          name: note.reviewer.name,
        },
      })),
      resumes,
    },
  });
}
