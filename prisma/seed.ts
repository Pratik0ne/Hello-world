import { PrismaClient } from '@prisma/client';
import { hashToken } from '../src/lib/utils/hash';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@proofhire.in' },
    update: { role: 'ADMIN', name: 'ProofHire Admin' },
    create: {
      email: 'admin@proofhire.in',
      name: 'ProofHire Admin',
      role: 'ADMIN',
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@proofhire.in' },
    update: { role: 'REVIEWER', name: 'ProofHire Reviewer' },
    create: {
      email: 'reviewer@proofhire.in',
      name: 'ProofHire Reviewer',
      role: 'REVIEWER',
    },
  });

  const candidate1 = await prisma.user.upsert({
    where: { email: 'candidate1@example.in' },
    update: { name: 'Ananya Iyer', role: 'USER' },
    create: {
      email: 'candidate1@example.in',
      name: 'Ananya Iyer',
      role: 'USER',
    },
  });

  const profile1 = await prisma.candidateProfile.upsert({
    where: { userId: candidate1.id },
    update: {
      phone: '+919812345678',
      yearsExp: 6,
      primaryCloud: 'GCP',
      tools: ['Airflow', 'BigQuery', 'dbt'],
      status: 'UNDER_REVIEW',
    },
    create: {
      userId: candidate1.id,
      phone: '+919812345678',
      yearsExp: 6,
      primaryCloud: 'GCP',
      tools: ['Airflow', 'BigQuery', 'dbt'],
      status: 'UNDER_REVIEW',
    },
  });

  await prisma.resume.create({
    data: {
      candidateId: profile1.id,
      gcsKey: 'uploads/demo-candidate1/latest.pdf',
      fileType: 'application/pdf',
    },
  });

  await prisma.portfolio.upsert({
    where: { candidateId: profile1.id },
    update: {
      kaggleUrl: 'https://www.kaggle.com/ananyaiyer',
      blogUrl: 'https://medium.com/@ananya',
    },
    create: {
      candidateId: profile1.id,
      kaggleUrl: 'https://www.kaggle.com/ananyaiyer',
      blogUrl: 'https://medium.com/@ananya',
    },
  });

  await prisma.referee.upsert({
    where: { candidateId: profile1.id },
    update: {
      email: 'manager@example.in',
      tokenHash: hashToken('seed-token-1'),
      verifiedAt: new Date(),
    },
    create: {
      candidateId: profile1.id,
      email: 'manager@example.in',
      tokenHash: hashToken('seed-token-1'),
      verifiedAt: new Date(),
    },
  });

  const candidate2 = await prisma.user.upsert({
    where: { email: 'candidate2@example.in' },
    update: { name: 'Rohit Sharma', role: 'USER' },
    create: {
      email: 'candidate2@example.in',
      name: 'Rohit Sharma',
      role: 'USER',
    },
  });

  const profile2 = await prisma.candidateProfile.upsert({
    where: { userId: candidate2.id },
    update: {
      phone: '+919700000000',
      yearsExp: 3,
      primaryCloud: 'AWS',
      tools: ['Glue', 'Redshift'],
      status: 'SUBMITTED',
    },
    create: {
      userId: candidate2.id,
      phone: '+919700000000',
      yearsExp: 3,
      primaryCloud: 'AWS',
      tools: ['Glue', 'Redshift'],
      status: 'SUBMITTED',
    },
  });

  await prisma.resume.create({
    data: {
      candidateId: profile2.id,
      gcsKey: 'uploads/demo-candidate2/latest.pdf',
      fileType: 'application/pdf',
    },
  });

  await prisma.reviewNote.create({
    data: {
      candidateId: profile2.id,
      reviewerId: reviewer.id,
      message: 'Review in progress - awaiting referee confirmation.',
    },
  });

  console.info('Seed data created', { admin: admin.email, reviewer: reviewer.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
