import { MetaPixel } from '@/components/analytics/MetaPixel';
import { WebVitals } from '@/components/analytics/WebVitals';
import { GoogleTagManager } from '@next/third-parties/google';
import { NavigationGuardProvider } from 'next-navigation-guard';
import { defaultMetadata } from './(scoreboard)/defaultMetadata';

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en' suppressHydrationWarning className='dark'>
            <head>
                <GoogleTagManager gtmId='AW-11305370226' />
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
