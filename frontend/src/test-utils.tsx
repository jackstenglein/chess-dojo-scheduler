/*
 * This module is meant to be included by our unit tests instead of
 * @testing-library/react as a convenience
 */
import { ApiProvider } from '@/api/Api';
import { CacheProvider } from '@/api/cache/Cache';
import { AuthProvider } from '@/auth/Auth';
import { RequireProfile } from '@/components/auth/RequireProfile';
import { LocalizationProvider } from '@/components/mui/LocalizationProvider';
import ThemeProvider from '@/style/ThemeProvider';
import { render, RenderOptions } from '@testing-library/react';
import { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>
        <AuthProvider>
            <ApiProvider>
                <RequireProfile />

                <CacheProvider>
                    <LocalizationProvider>{children}</LocalizationProvider>
                </CacheProvider>
            </ApiProvider>
        </AuthProvider>
    </ThemeProvider>
);

const customRender = (ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) =>
    render(ui, { wrapper, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
