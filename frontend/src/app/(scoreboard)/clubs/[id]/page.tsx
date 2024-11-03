import { Suspense } from 'react';
import { ClubDetailsPage } from './ClubDetailsPage';

export function generateStaticParams() {
    return [];
}

export default function Page({ params: { id } }: { params: { id: string } }) {
    return (
        <Suspense>
            <ClubDetailsPage id={id} />
        </Suspense>
    );
}
