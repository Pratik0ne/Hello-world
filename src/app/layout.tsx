import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils/cn';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://proofhire-de.vercel.app'),
  title: {
    default: 'ProofHire DE | Verified Data Engineering Talent',
    template: '%s | ProofHire DE',
  },
  description:
    'ProofHire DE verifies the authenticity of Data Engineering professionals in India with rigorous resume, portfolio, and referee checks.',
  keywords: ['Data Engineering', 'Verification', 'ProofHire', 'India'],
  openGraph: {
    title: 'ProofHire DE',
    description:
      'Proof-first hiring for Data Engineers in India. Upload, verify, and stand out.',
    url: 'https://proofhire-de.vercel.app',
    siteName: 'ProofHire DE',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProofHire DE',
    description:
      'Proof-first hiring for Data Engineers in India. Upload, verify, and stand out.',
  },
  applicationName: 'ProofHire DE',
  authors: [{ name: 'ProofHire' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen bg-slate text-charcoal')}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
