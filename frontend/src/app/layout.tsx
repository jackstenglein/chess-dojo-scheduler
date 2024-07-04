import { ApiProvider } from '@/api/Api';
import { AuthProvider } from '@/auth/Auth';
import Navbar from '@/navbar/Navbar';
import ThemeProvider from '@/style/ThemeProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'ChessDojo',
    description:
        'View the scoreboard, schedule meetings and more for the ChessDojo Training Program',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang='en' suppressHydrationWarning>
            <head>
                <link rel='apple-touch-icon' href='/android-chome-192x192.png' />
                <link rel='manifest' href='/manifest.json' />
            </head>
            <body>
                <div id='root'>
                    <AppRouterCacheProvider>
                        <ThemeProvider>
                            <AuthProvider>
                                <ApiProvider>
                                    <Navbar />

                                    {children}
                                </ApiProvider>
                            </AuthProvider>
                        </ThemeProvider>
                    </AppRouterCacheProvider>
                </div>
            </body>
        </html>
    );
}
