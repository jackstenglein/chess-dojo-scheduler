import { Suspense } from 'react';
import { ProfilePage } from './ProfilePage';

export function generateStaticParams() {
    return [];
}

export default function Page({ params: { username } }: { params: { username: string } }) {
    return (
        <Suspense>
            <ProfilePage username={username} />
        </Suspense>
    );
}
