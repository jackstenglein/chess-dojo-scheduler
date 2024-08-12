import { runWithAmplifyServerContext } from '@/auth/amplifyServerUtils';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { NextRequest, NextResponse } from 'next/server';

const publicPaths = [
    '/',
    '/signin',
    '/signup',
    '/verify-email',
    '/forgot-password',
    '/help',
    '/tournaments',
    '/courses',
    '/material/books',
    '/material/ratings',
    '/blog',
    '/coaching',
    '/dojodigest/unsubscribe',
    '/prices',
    '/clubs',
    '/games/.*/.*',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    for (const path of publicPaths) {
        if (pathname.match(path)) {
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

    if (authenticated) {
        return response;
    }

    return NextResponse.redirect(new URL('/signin', request.url));
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
