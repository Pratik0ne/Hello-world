import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXTAUTH_URL ?? 'https://proofhire-de.vercel.app';
  return [
    { url: `${base}/`, priority: 1, changeFrequency: 'monthly' },
    { url: `${base}/login`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${base}/onboarding`, priority: 0.7, changeFrequency: 'monthly' },
    { url: `${base}/dashboard`, priority: 0.7, changeFrequency: 'monthly' },
  ];
}
