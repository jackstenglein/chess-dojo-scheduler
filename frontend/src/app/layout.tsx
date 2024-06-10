import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ChessDojo',
    description:
        'View the scoreboard, schedule meetings and more for the ChessDojo Training Program',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en'>
            <head>
                <meta name='theme-color' content='#000000' />
                <link rel='apple-touch-icon' href='/android-chome-192x192.png' />
                <link rel='manifest' href='/manifest.json' />
                <title>ChessDojo</title>
            </head>
            <body>
                <div id='root'>{children}</div>
                <script type='module' src='/src/index.tsx'></script>
            </body>
        </html>
    );
}
