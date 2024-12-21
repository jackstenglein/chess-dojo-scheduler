import { Suspense } from 'react';
import ExplorerPage from './ExplorerPage';

export default function Page() {
    return (
        <Suspense>
            <ExplorerPage />
        </Suspense>
    );
}
