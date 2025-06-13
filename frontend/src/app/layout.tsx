import { MetaPixel } from '@/components/analytics/MetaPixel';
import { WebVitals } from '@/components/analytics/WebVitals';
import { NavigationGuardProvider } from 'next-navigation-guard';
import ReactGA from 'react-ga4';
import { defaultMetadata } from './(scoreboard)/defaultMetadata';

export const metadata = defaultMetadata;

ReactGA.initialize('AW-11305370226');

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
                    <div id='root'>{children}</div>
                </NavigationGuardProvider>
            </body>
        </html>
    );
}
