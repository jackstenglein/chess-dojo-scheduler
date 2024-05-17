import theme from '@/theme';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { Metadata } from 'next';
import { AuthProvider } from './auth/Auth';
import './globals.css';
import Navbar from './navbar/Navbar';

export const metadata: Metadata = {
    title: 'ChessDojo Blog',
    description: 'Covering all topics related to Chess training and improvement',
    keywords: ['Chess', 'Dojo', 'Training', 'Improvement'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <body>
                <AppRouterCacheProvider>
                    <ThemeProvider theme={theme}>
                        <CssBaseline enableColorScheme />
                        <AuthProvider>
                            <Navbar />
                            {children}
                        </AuthProvider>
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}
