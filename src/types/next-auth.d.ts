import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: 'USER' | 'REVIEWER' | 'ADMIN';
    };
  }

  interface User {
    role: 'USER' | 'REVIEWER' | 'ADMIN';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'USER' | 'REVIEWER' | 'ADMIN';
  }
}
