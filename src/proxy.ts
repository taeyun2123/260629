import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRoleCookie = request.cookies.get('user_role');
  const userRole = userRoleCookie?.value;

  // Protect Teacher routes
  if (pathname.startsWith('/teacher')) {
    if (userRole !== 'TEACHER') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Protect Forest (Student Main) routes
  if (pathname.startsWith('/forest')) {
    // Both teacher and student can potentially view forest if needed, 
    // but typically it's for students. Let's ensure at least someone is logged in.
    if (!userRole) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If logged in and at root, redirect to respective dashboard
  if (pathname === '/') {
    if (userRole === 'TEACHER') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
    } else if (userRole === 'STUDENT') {
      return NextResponse.redirect(new URL('/forest', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If on login page but already logged in, redirect away
  if (pathname === '/login') {
    if (userRole === 'TEACHER') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
    } else if (userRole === 'STUDENT') {
      return NextResponse.redirect(new URL('/forest', request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/',
    '/login',
    '/teacher/:path*',
    '/forest/:path*'
  ],
};
