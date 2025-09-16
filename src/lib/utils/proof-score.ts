import type { Portfolio, Referee, Resume } from '@prisma/client';

export function calculateProofScore(args: {
  resumes: Resume[];
  portfolio?: Portfolio | null;
  referee?: Referee | null;
}): { score: number; flagged: boolean } {
  let score = 0;
  if (args.resumes.some((r) => !r.archived)) {
    score += 40;
  }
  if (args.portfolio && (args.portfolio.blogUrl || args.portfolio.kaggleUrl || args.portfolio.siteUrl)) {
    score += 20;
  }
  if (args.referee?.verifiedAt) {
    score += 40;
  }
  return { score, flagged: score < 40 };
}
