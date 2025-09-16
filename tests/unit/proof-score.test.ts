import { describe, expect, it } from 'vitest';
import { calculateProofScore } from '@/lib/utils/proof-score';

describe('calculateProofScore', () => {
  it('gives 0 when no signals present', () => {
    const result = calculateProofScore({ resumes: [] });
    expect(result.score).toBe(0);
    expect(result.flagged).toBe(true);
  });

  it('adds weights per signal', () => {
    const result = calculateProofScore({
      resumes: [{ archived: false } as any],
      portfolio: { kaggleUrl: 'https://kaggle.com/' } as any,
      referee: { verifiedAt: new Date() } as any,
    });
    expect(result.score).toBe(100);
    expect(result.flagged).toBe(false);
  });
});
