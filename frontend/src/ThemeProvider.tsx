import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/system';
import { createTheme } from '@mui/material/styles';
import { CssBaseline, PaletteMode } from '@mui/material';

import { useAuth } from './auth/Auth';

declare module '@mui/material/styles' {
    interface Palette {
        opening: Palette['primary'];
        endgame: Palette['primary'];
        dojoOrange: Palette['primary'];
    }
    interface PaletteOptions {
        opening?: PaletteOptions['primary'];
        endgame?: Palette['primary'];
        dojoOrange?: PaletteOptions['primary'];
    }
}

declare module '@mui/material' {
    interface ChipPropsColorOverrides {
        opening: true;
        endgame: true;
    }

    interface CheckboxPropsColorOverrides {
        opening: true;
        endgame: true;
    }

    interface ButtonPropsColorOverrides {
        dojoOrange: true;
    }
}

const defaultTheme = createTheme({});

export function useLocalStorage(
    storageKey: string,
    fallbackState: string
): [string, (v: string) => void] {
    const [value, setValue] = useState(localStorage.getItem(storageKey) || fallbackState);

    useEffect(() => {
        localStorage.setItem(storageKey, value);
    }, [value, storageKey]);

    return [value, setValue];
}

export function useLightMode(): boolean {
    return useAuth().user?.enableLightMode || false;
}

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const user = useAuth().user;
    const [colorMode, setColorMode] = useLocalStorage(
        'colorMode',
        user?.enableLightMode ? 'light' : 'dark'
    );

    useEffect(() => {
        if (user) {
            setColorMode(user.enableLightMode ? 'light' : 'dark');
        }
    }, [setColorMode, user]);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode: colorMode as PaletteMode,
                    dojoOrange: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#F7941F',
                        },
                        name: 'dojoOrange',
                    }),
                    opening: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#cc0000',
                        },
                        name: 'opening',
                    }),
                    endgame: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#674ea7',
                        },
                        name: 'endgame',
                    }),
                },
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
