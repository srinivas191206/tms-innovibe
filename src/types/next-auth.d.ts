import DefaultSession from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      departmentId: string | null;
      photo: string | null;
      gender: string | null;
      dob: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: string;
    departmentId: string | null;
    photo: string | null;
    gender: string | null;
    dob: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    departmentId: string | null;
    photo: string | null;
    gender: string | null;
    dob: string | null;
  }
}
