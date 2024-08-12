import { runWithAmplifyServerContext } from '@/auth/amplifyServerUtils';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { NextRequest, NextResponse } from 'next/server';

const publicPaths = [
    /^\/help$/,
    /^\/tournaments$/,
    /^\/tournaments\/open-classical$/,
    /^\/tournaments\/open-classical\/info$/,
    /^\/tournaments\/open-classical\/register$/,
    /^\/tournaments\/open-classical\/submit-results$/,
    /^\/tournaments\/open-classical\/previous$/,
    /^\/courses$/,
    /^\/material\/books$/,
    /^\/material\/ratings$/,
    /^\/blog$/,
    /^\/coaching$/,
    /^\/dojodigest\/unsubscribe$/,
    /^\/prices$/,
    /^\/clubs$/,
    /^\/games\/.*\/.*$/,
];

const unauthenticatedPaths = [
    /^\/$/,
    /^\/signin$/,
    /^\/signup$/,
    /^\/verify-email$/,
    /^\/forgot-password$/,
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    for (const path of publicPaths) {
        if (pathname.match(path)) {
            console.log('Public path');
            return response;
        }
    }

    const authenticated = await runWithAmplifyServerContext({
        nextServerContext: { request, response },
        operation: async (contextSpec) => {
            try {
                const session = await fetchAuthSession(contextSpec);
                return (
                    session.tokens?.accessToken !== undefined &&
                    session.tokens?.idToken !== undefined
                );
            } catch (error) {
                console.log(error);
                return false;
            }
        },
    });

    let unauthenticatedPath = false;
    for (const path of unauthenticatedPaths) {
        if (pathname.match(path)) {
            unauthenticatedPath = true;
        }
    }

    if (authenticated !== unauthenticatedPath) {
        console.log('authenticated !== unauthenticatedPath');
        return response;
    }

    if (authenticated) {
        console.log('Redirect to /profile');
        return NextResponse.redirect(new URL('/profile', request.url));
    }

    console.log('Not authenticated');
    return NextResponse.redirect(new URL(`/?redirectUri=${pathname}`, request.url));
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
