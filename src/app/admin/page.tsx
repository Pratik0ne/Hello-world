import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/session';
import { db } from '@/lib/prisma';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'REVIEWER')) {
    redirect('/dashboard');
  }

  const queue = await db.candidateProfile.findMany({
    include: {
      user: true,
      portfolio: true,
      referee: true,
      resumes: { orderBy: { uploadedAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <AdminDashboard
        initialQueue={JSON.parse(
          JSON.stringify(
            queue.map((candidate) => ({
              id: candidate.id,
              name: candidate.user?.name,
              email: candidate.user?.email,
              status: candidate.status,
              updatedAt: candidate.updatedAt,
              portfolio: candidate.portfolio,
              referee: candidate.referee,
              resumeKey: candidate.resumes[0]?.gcsKey ?? null,
              proofScore: candidate.proofScore,
            }))
          )
        )}
        viewerRole={session.user.role}
      />
    </div>
  );
}
