'use client';

import { CssBaseline } from '@mui/material';
import { deepPurple } from '@mui/material/colors';
import {
    Experimental_CssVarsProvider,
    createTheme,
    experimental_extendTheme,
    getInitColorSchemeScript,
} from '@mui/material/styles';
import { ReactNode } from 'react';

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
        explorerTotal: Palette['primary'];
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
        explorerTotal?: Palette['primary'];
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
    }
}

const defaultTheme = createTheme({});

const defaultPalette = {
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
};

const theme = experimental_extendTheme({
    colorSchemes: {
        light: {
            palette: {
                ...defaultPalette,
            },
        },
        dark: {
            palette: defaultPalette,
        },
    },
});

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    return (
        <Experimental_CssVarsProvider defaultMode='dark' theme={theme}>
            <CssBaseline enableColorScheme />
            {getInitColorSchemeScript()}
            {children}
        </Experimental_CssVarsProvider>
    );
};

export default ThemeProvider;
