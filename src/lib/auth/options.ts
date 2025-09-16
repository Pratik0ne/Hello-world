import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import LinkedInProvider from 'next-auth/providers/linkedin';
import { db } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'r_liteprofile r_emailaddress',
        },
      },
      profile(profile) {
        const firstName = (profile.localizedFirstName ?? '').trim();
        const lastName = (profile.localizedLastName ?? '').trim();
        const name = `${firstName} ${lastName}`.trim() || profile.localizedFirstName || profile.localizedLastName;
        const image =
          profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier ?? null;
        return {
          id: profile.id,
          name,
          email: (profile.emailAddress as string | undefined) ?? null,
          image,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? 'USER';
        token.id = user.id;
      }
      if (!token.role && token.email) {
        const existing = await db.user.findUnique({ where: { email: token.email } });
        token.role = existing?.role ?? 'USER';
        token.id = existing?.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? 'USER';
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
