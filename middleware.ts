import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const pathname = req.nextUrl.pathname;

    if (pathname.startsWith('/admin') && role !== 'ADMIN' && role !== 'REVIEWER') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN' || token?.role === 'REVIEWER';
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/admin/:path*'],
};
