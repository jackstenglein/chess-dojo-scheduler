import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/system';
import { createTheme } from '@mui/material/styles';
import { CssBaseline, PaletteMode } from '@mui/material';

import { useAuth } from './auth/Auth';

declare module '@mui/material/styles' {
    interface Theme {
        zIndex: {
            tooltip: number;
        };
    }
}

function useLocalStorage(
    storageKey: string,
    fallbackState: string
): [string, (v: string) => void] {
    const [value, setValue] = useState(localStorage.getItem(storageKey) || fallbackState);

    useEffect(() => {
        localStorage.setItem(storageKey, value);
    }, [value, storageKey]);

    return [value, setValue];
}

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const user = useAuth().user;
    const [colorMode, setColorMode] = useLocalStorage(
        'colorMode',
        user?.enableDarkMode ? 'dark' : 'light'
    );

    useEffect(() => {
        if (user) {
            setColorMode(user.enableDarkMode ? 'dark' : 'light');
        }
    }, [setColorMode, user]);

    const theme = useMemo(
        () =>
            createTheme({
                zIndex: {
                    tooltip: 1299,
                },
                palette: { mode: colorMode as PaletteMode },
            }),
        [colorMode]
    );

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </MuiThemeProvider>
    );
};

export default ThemeProvider;
