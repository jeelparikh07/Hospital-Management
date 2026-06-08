import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple JWT decode function (for middleware only)
function decodeToken(token: string): { role?: string; userId?: string } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get('token')?.value;
  const isAuthenticated = !!token;

  // Public routes - always allow
  if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
    return NextResponse.next();
  }

  // Protected routes
  const protectedRoutes = ['/patient', '/doctor', '/reception', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check role-based access
    const decoded = decodeToken(token);
    const userRole = decoded?.role;

    if (userRole) {
      // Redirect users to their correct dashboard if they're on the wrong one
      if (pathname === '/patient/dashboard' && userRole !== 'patient') {
        return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
      }
      if (pathname === '/doctor/dashboard' && userRole !== 'doctor') {
        return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
      }
      if (pathname === '/reception/dashboard' && userRole !== 'receptionist') {
        return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
      }
      if (pathname === '/admin/dashboard' && userRole !== 'admin') {
        return NextResponse.redirect(new URL(`/${userRole}/dashboard`, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
