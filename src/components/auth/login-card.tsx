'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export function LoginCard() {
  return (
    <Card className="max-w-md text-center">
      <CardHeader>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo/10 text-indigo">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle>Access ProofHire DE</CardTitle>
        <CardDescription>Sign in with a trusted provider to begin verification.</CardDescription>
      </CardHeader>
      <div className="space-y-4">
        <Button className="w-full" onClick={() => signIn('google', { callbackUrl: '/onboarding' })}>
          Continue with Google
        </Button>
        <Button className="w-full" onClick={() => signIn('linkedin', { callbackUrl: '/onboarding' })}>
          Continue with LinkedIn
        </Button>
      </div>
      <p className="mt-6 text-xs text-charcoal/60">
        ProofHire DE supports Google and LinkedIn authentication only. We never store your passwords, and login is required
        for secure resume uploads.
      </p>
    </Card>
  );
}
