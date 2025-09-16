import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/session';
import { ensureCandidate } from '@/lib/services/candidate';
import { CandidateDashboard } from '@/components/dashboard/candidate-dashboard';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }
  const candidate = await ensureCandidate(session.user.id);
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <CandidateDashboard candidate={JSON.parse(JSON.stringify(candidate))} />
    </div>
  );
}
