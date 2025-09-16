import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/session';
import { LoginCard } from '@/components/auth/login-card';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/onboarding');
  }
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate px-6 py-16">
      <LoginCard />
    </div>
  );
}
