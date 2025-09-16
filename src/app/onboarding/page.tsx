import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/session';
import { ensureCandidate } from '@/lib/services/candidate';
import { OnboardingStepper } from '@/components/forms/onboarding-stepper';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const candidate = await ensureCandidate(session.user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-3xl font-bold text-navy">Onboarding</h1>
        <p className="mt-2 text-sm text-charcoal/80">
          Complete each step to submit your profile for reviewer verification. Save progress anytime.
        </p>
      </div>
      <OnboardingStepper candidate={JSON.parse(JSON.stringify(candidate))} userName={session.user.name} />
    </div>
  );
}
