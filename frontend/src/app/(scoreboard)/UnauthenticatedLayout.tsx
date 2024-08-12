import { UnauthenticatedNavbar } from '@/navbar/UnauthenticatedNavbar';
import ThemeProvider from '@/style/ThemeProvider';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';

export function UnauthenticatedLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppRouterCacheProvider>
            <ThemeProvider>
                <UnauthenticatedNavbar />
                {children}
            </ThemeProvider>
        </AppRouterCacheProvider>
    );
}
