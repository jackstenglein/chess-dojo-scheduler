import { MetaPixel } from '@/components/analytics/MetaPixel';
import { WebVitals } from '@/components/analytics/WebVitals';
import { getConfig } from '@/config';
import { Metadata } from 'next';

export const metadata: Metadata = {
    metadataBase: new URL(getConfig().baseUrl),
    title: 'ChessDojo Training Program',
    description:
        'The ChessDojo Training Program offers structured training plans for all levels 0-2500, along with an active and supportive community',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en' suppressHydrationWarning className='dark'>
            <head>
                <link rel='apple-touch-icon' href='/android-chome-192x192.png' />
                <link rel='manifest' href='/manifest.json' />
            </head>
            <body>
                <MetaPixel />
                <WebVitals />
                <div id='root'>{children}</div>
            </body>
        </html>
    );
}
