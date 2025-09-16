import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'REVIEWER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const candidates = await db.candidateProfile.findMany({
    where: {
      status: {
        in: ['SUBMITTED', 'UNDER_REVIEW', 'REWORK_REQUESTED'],
      },
    },
    include: {
      user: true,
      referee: true,
      portfolio: true,
      resumes: {
        orderBy: { uploadedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return NextResponse.json({
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.user?.name,
      email: candidate.user?.email,
      status: candidate.status,
      proofScore: candidate.proofScore,
      refereeVerified: !!candidate.referee?.verifiedAt,
      hasPortfolio: !!(
        candidate.portfolio?.blogUrl || candidate.portfolio?.kaggleUrl || candidate.portfolio?.siteUrl
      ),
      latestResumeKey: candidate.resumes[0]?.gcsKey,
      updatedAt: candidate.updatedAt,
    })),
  });
}
