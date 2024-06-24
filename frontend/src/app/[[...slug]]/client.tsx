'use client';

import dynamic from 'next/dynamic';
import { useReportWebVitals } from 'next/web-vitals';
import ReactGA from 'react-ga4';

const App = dynamic(() => import('../../App'), { ssr: false });

ReactGA.initialize('G-9VPNTDELD2');

export function ClientOnly() {
    useReportWebVitals(({ id, name, value }) => {
        ReactGA.event({
            category: 'Web Vitals',
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
            action: name,
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
            label: id,
            /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
            value: Math.round(name === 'CLS' ? value * 1000 : value),
            nonInteraction: true,
            transport: 'beacon',
        });
    });

    return <App />;
}
