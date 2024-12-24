/*
 * This module is meant to be included by our unit tests instead of
 * @testing-library/react as a convenience
 */
import { ApiProvider } from '@/api/Api';
import { CacheProvider } from '@/api/cache/Cache';
import { AuthProvider, useAuth } from '@/auth/Auth';
import { LocalizationProvider } from '@/components/mui/LocalizationProvider';
import ThemeProvider from '@/style/ThemeProvider';
import { render, RenderOptions } from '@testing-library/react';
import { ReactNode, useEffect, useState } from 'react';
import { getConfig } from './config';

const AuthShim = ({ children }: { children: ReactNode }) => { 
    const { signin } = useAuth();
    const {cognito_test_username, cognito_test_password} = getConfig();
    const [ready, setReady] = useState(false);
    
    useEffect(() => {
        signin(cognito_test_username, cognito_test_password).then(()=>setReady(true)).catch((err) => console.error("Signin error", err))
    }, [cognito_test_username, cognito_test_password, signin]);

    return ready ? children : <></>;
}

const wrapper = ({ children }: { children: ReactNode }) =>
    <ThemeProvider>
        <AuthProvider>
            <ApiProvider>
                <CacheProvider>
                    <LocalizationProvider>
                        <AuthShim>{children}</AuthShim>
                    </LocalizationProvider>
                </CacheProvider>
            </ApiProvider>
        </AuthProvider>
    </ThemeProvider>

const customRender = (ui: ReactNode, options?: Omit<RenderOptions, 'wrapper'>) =>
    render(ui, { wrapper, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render };
