import { CssBaseline, PaletteMode } from '@mui/material';
import { deepPurple } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';
import { ThemeProvider as MuiThemeProvider } from '@mui/system';
import { ReactNode, useEffect, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useAuth } from './auth/Auth';

declare module '@mui/material/styles' {
    interface Palette {
        opening: Palette['primary'];
        endgame: Palette['primary'];
        dojoOrange: Palette['primary'];
        subscribe: Palette['primary'];
        coaching: Palette['primary'];
        liga: Palette['primary'];
        book: Palette['primary'];
        meet: Palette['primary'];
        cblack?: Palette['primary'];
    }
    interface PaletteOptions {
        opening?: PaletteOptions['primary'];
        endgame?: Palette['primary'];
        dojoOrange?: PaletteOptions['primary'];
        subscribe?: PaletteOptions['primary'];
        coaching?: PaletteOptions['primary'];
        liga?: PaletteOptions['primary'];
        book?: Palette['primary'];
        meet?: Palette['primary'];
        cblack?: Palette['primary'];
    }
}

declare module '@mui/material' {
    interface ChipPropsColorOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
        cblack: true;
    }

    interface CheckboxPropsColorOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
        cblack: true;
    }

    interface ButtonPropsColorOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
        cblack: true;
    }

    interface SvgIconPropsColorOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
        cblack: true;
    }
}

const defaultTheme = createTheme({});

export function useLightMode(): boolean {
    return useAuth().user?.enableLightMode || false;
}

export function useWindowSizeEffect(handler: () => void) {
    useEffect(() => {
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [handler]);
}

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const user = useAuth().user;
    const [colorMode, setColorMode] = useLocalStorage(
        'colorMode',
        user?.enableLightMode ? 'light' : 'dark',
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
                    cblack: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#050a06',
                        },
                        name: 'cblack',
                    }),
                    meet: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#93a84f',
                        },
                        name: 'meet',
                    }),
                    book: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#d95dc6',
                        },
                        name: 'book',
                    }),
                    liga: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#45b579',
                        },
                        name: 'liga',
                    }),
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
                    subscribe: defaultTheme.palette.augmentColor({
                        color: {
                            main: '#1565c0',
                        },
                        name: 'subscribe',
                    }),
                    coaching: defaultTheme.palette.augmentColor({
                        color: {
                            main: deepPurple[200],
                        },
                        name: 'coaching',
                    }),
                },
            }),
        [colorMode],
    );

    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            {children}
        </MuiThemeProvider>
    );
};

export default ThemeProvider;
