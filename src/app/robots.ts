import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? 'https://proofhire-de.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login'],
      disallow: ['/dashboard', '/onboarding', '/admin'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
