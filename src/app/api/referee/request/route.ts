import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';
import { ensureCandidate } from '@/lib/services/candidate';
import { resend } from '@/lib/email/resend';
import { refereeEmailTemplate } from '@/lib/email/templates';
import { generateToken, hashToken } from '@/lib/utils/hash';

const schema = z.object({
  email: z.string().email(),
});

const freeDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];

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

  const domain = parsed.data.email.split('@')[1]?.toLowerCase();
  if (!domain || freeDomains.includes(domain)) {
    return NextResponse.json({ error: 'Use a work domain email' }, { status: 400 });
  }

  const candidate = await ensureCandidate(session.user.id);
  const token = generateToken();
  const hashed = hashToken(token);

  await db.referee.upsert({
    where: { candidateId: candidate.id },
    update: {
      email: parsed.data.email,
      tokenHash: hashed,
      requestedAt: new Date(),
      verifiedAt: null,
    },
    create: {
      candidateId: candidate.id,
      email: parsed.data.email,
      tokenHash: hashed,
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/referee/verify?token=${token}`;

  if (resend) {
    try {
      await resend.emails.send({
        from: 'ProofHire DE <verify@proofhire.in>',
        to: parsed.data.email,
        subject: 'Verify candidate for ProofHire DE',
        html: refereeEmailTemplate(session.user.name ?? 'The candidate', verificationUrl),
      });
    } catch (error) {
      console.error('Resend error', error);
    }
  }

  return NextResponse.json({ ok: true });
}
