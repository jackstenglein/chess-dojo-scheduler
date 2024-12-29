import { Suspense } from 'react';
import FollowersPage from './FollowersPage';

export function generateStaticParams() {
    return [{ type: 'followers' }, { type: 'following' }];
}

export default function Page({
    params: { username, type },
}: {
    params: { username: string; type: 'followers' | 'following' };
}) {
    return (
        <Suspense>
            <FollowersPage username={username} type={type} />
        </Suspense>
    );
}
