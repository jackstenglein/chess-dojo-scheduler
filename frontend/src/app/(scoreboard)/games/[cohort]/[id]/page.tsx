import { Suspense } from 'react';
import GamePage from './GamePage';

export function generateStaticParams() {
    return [];
}

export default function Page({
    params: { cohort, id },
}: {
    params: { cohort: string; id: string };
}) {
    return (
        <Suspense>
            <GamePage cohort={cohort} id={id} />
        </Suspense>
    );
}
