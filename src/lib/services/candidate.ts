import { db } from '@/lib/prisma';
import { calculateProofScore } from '@/lib/utils/proof-score';

export async function ensureCandidate(userId: string) {
  const candidate = await db.candidateProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      resumes: true,
      portfolio: true,
      referee: true,
    },
  });
  return candidate;
}

export async function refreshProofScore(candidateId: string) {
  const candidate = await db.candidateProfile.findUnique({
    where: { id: candidateId },
    include: { resumes: true, portfolio: true, referee: true },
  });
  if (!candidate) return;
  const { score } = calculateProofScore({
    resumes: candidate.resumes,
    portfolio: candidate.portfolio ?? undefined,
    referee: candidate.referee ?? undefined,
  });
  await db.candidateProfile.update({
    where: { id: candidateId },
    data: { proofScore: score },
  });
}
