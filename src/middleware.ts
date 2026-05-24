import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role;

    // 1. Admin paths: strictly ADMIN
    if (path.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url));
    }

    // 2. Department Head paths: DEPT_HEAD or ADMIN
    if (path.startsWith('/head') && role !== 'DEPT_HEAD' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url));
    }

    // 3. Employee paths: EMPLOYEE, DEPT_HEAD, or ADMIN
    if (path.startsWith('/employee') && role !== 'EMPLOYEE' && role !== 'DEPT_HEAD' && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/head/:path*',
    '/employee/:path*',
  ],
};
