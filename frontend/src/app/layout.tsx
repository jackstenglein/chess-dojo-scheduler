import { MetaPixel } from '@/components/analytics/MetaPixel';
import { ServiceWorkerProvider } from '@/components/ServiceWorkerProvider';
import { WebVitals } from '@/components/analytics/WebVitals';
import { OfflineIndicator as _OfflineIndicator } from '@/components/OfflineIndicator';
import { NavigationGuardProvider } from 'next-navigation-guard';
import { defaultMetadata } from './(scoreboard)/defaultMetadata';

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en' suppressHydrationWarning className='dark'>
            <head>
                {/* Apple Touch Icons - Multiple sizes for iOS compatibility */}
                <link rel='apple-touch-icon' sizes='57x57' href='/apple-touch-icon-57x57.png' />
                <link rel='apple-touch-icon' sizes='60x60' href='/apple-touch-icon-60x60.png' />
                <link rel='apple-touch-icon' sizes='72x72' href='/apple-touch-icon-72x72.png' />
                <link rel='apple-touch-icon' sizes='76x76' href='/apple-touch-icon-76x76.png' />
                <link rel='apple-touch-icon' sizes='114x114' href='/apple-touch-icon-114x114.png' />
                <link rel='apple-touch-icon' sizes='120x120' href='/apple-touch-icon-120x120.png' />
                <link rel='apple-touch-icon' sizes='144x144' href='/apple-touch-icon-144x144.png' />
                <link rel='apple-touch-icon' sizes='152x152' href='/apple-touch-icon-152x152.png' />
                <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
                
                {/* Fallback apple-touch-icon without sizes */}
                <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
                
                {/* Standard favicons */}
                <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
                <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
                
                {/* Manifest */}
                <link rel='manifest' href='/manifest.json' />
                
                {/* Theme and PWA meta tags */}
                <meta name='theme-color' content='#1e3c72' />
                <meta name='apple-mobile-web-app-capable' content='yes' />
                <meta name='apple-mobile-web-app-status-bar-style' content='default' />
                <meta name='apple-mobile-web-app-title' content='Chess Dojo' />
                <meta name='mobile-web-app-capable' content='yes' />
                
                {/* Additional iOS meta tags */}
                <meta name='apple-touch-fullscreen' content='yes' />
                <meta name='format-detection' content='telephone=no' />
            </head>
            <body>
                <NavigationGuardProvider>
                    <MetaPixel />
                    <WebVitals />
                    <ServiceWorkerProvider />
                    {/* <OfflineIndicator /> */}
                    <div id='root'>{children}</div>
                </NavigationGuardProvider>
            </body>
        </html>
    );
}
