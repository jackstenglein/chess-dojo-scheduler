import { MetaPixel } from '@/components/analytics/MetaPixel';
import { ServiceWorkerProvider } from '@/components/ServiceWorkerProvider';
import { WebVitals } from '@/components/analytics/WebVitals';
import { NavigationGuardProvider } from 'next-navigation-guard';
import { defaultMetadata } from './(scoreboard)/defaultMetadata';

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en' suppressHydrationWarning className='dark'>
            <head>
                <link rel='apple-touch-icon' href='/android-chome-192x192.png' />
                <link rel='manifest' href='/manifest.json' />
            </head>
            <body>
                <NavigationGuardProvider>
                    <MetaPixel />
                    <WebVitals />
                    <ServiceWorkerProvider />
                    <div id='root'>{children}</div>
                </NavigationGuardProvider>
            </body>
        </html>
    );
}
