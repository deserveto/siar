/**
 * Next.js Middleware for Route Protection
 * Protects /dashboard/* and /api/* routes (except auth)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public paths that don't require authentication
    const publicPaths = [
        '/',
        '/auth/login',
        '/auth/register',
        '/api/auth',
    ];

    // Check if path is public
    const isPublicPath = publicPaths.some((path) =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    if (isPublicPath) {
        return NextResponse.next();
    }

    // Get the token from the request
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // Redirect to login if not authenticated
    if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Check for IT-only routes
    const itOnlyPaths = ['/dashboard/logs'];
    const isItOnlyPath = itOnlyPaths.some((path) => pathname.startsWith(path));

    if (isItOnlyPath && token.role !== 'IT') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|images|.*\\.svg$|.*\\.png$|.*\\.jpg$).*)',
    ],
};
