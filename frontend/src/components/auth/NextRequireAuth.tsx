'use client';

import { AuthStatus, useAuth } from '@/auth/Auth';
import { User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import NotFoundPage from '@/NotFoundPage';

export function NextRequireAuth({
    Component,
}: {
    Component: ({ user }: { user: User }) => JSX.Element;
}) {
    const { user, status } = useAuth();
    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }
    if (!user) {
        return <NotFoundPage />;
    }
    return <Component user={user} />;
}
