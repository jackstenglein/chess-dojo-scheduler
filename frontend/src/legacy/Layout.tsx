import { ApiProvider } from '@/api/Api';
import { CacheProvider } from '@/api/cache/Cache';
import { AuthProvider } from '@/auth/Auth';
import Navbar from '@/navbar/Navbar';
import ThemeProvider from '@/style/ThemeProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <AppRouterCacheProvider>
            <ThemeProvider>
                <AuthProvider>
                    <ApiProvider>
                        <CacheProvider>
                            <Navbar />

                            {children}
                        </CacheProvider>
                    </ApiProvider>
                </AuthProvider>
            </ThemeProvider>
        </AppRouterCacheProvider>
    );
}
