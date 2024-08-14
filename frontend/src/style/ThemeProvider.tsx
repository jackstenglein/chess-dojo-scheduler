'use client';

import { RequirementCategory } from '@/database/requirement';
import { CssBaseline } from '@mui/material';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { deepPurple } from '@mui/material/colors';
import {
    Experimental_CssVarsProvider,
    createTheme,
    experimental_extendTheme,
} from '@mui/material/styles';
import { ReactNode } from 'react';

export const CategoryColors: Record<RequirementCategory, string> = {
    [RequirementCategory.Welcome]: '#c27ba0',
    [RequirementCategory.Games]: '#fccdcf',
    [RequirementCategory.Tactics]: '#fc526d',
    [RequirementCategory.Middlegames]: '#f16fa4',
    [RequirementCategory.Endgame]: '#f897aa',
    [RequirementCategory.Opening]: '#d64c6c',
    [RequirementCategory.Graduation]: '#b22375',
    [RequirementCategory.NonDojo]: '#6f273a',
    [RequirementCategory.SuggestedTasks]: '#a31c60',
};

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
    interface LinearProgressPropsColorOverrides {
        [RequirementCategory.Welcome]: true;
        [RequirementCategory.Games]: true;
        [RequirementCategory.Tactics]: true;
        [RequirementCategory.Middlegames]: true;
        [RequirementCategory.Endgame]: true;
        [RequirementCategory.Opening]: true;
        [RequirementCategory.Graduation]: true;
        [RequirementCategory.NonDojo]: true;
        [RequirementCategory.SuggestedTasks]: true;
    }

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

const augmentRequirementColor = (c: RequirementCategory) =>
    defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors[c],
        },
        name: c,
    });

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
    games: defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors[RequirementCategory.Games],
        },
        name: 'games',
    }),
    opening: defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors.Opening,
        },
        name: 'opening',
    }),
    middlegames: defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors[RequirementCategory.Middlegames],
        },
        name: 'middlegames',
    }),
    endgame: defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors.Endgame,
        },
        name: 'endgame',
    }),
    welcome: defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors[RequirementCategory.Welcome],
        },
        name: 'welcome',
    }),
    suggestedTasks: defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors[RequirementCategory.SuggestedTasks],
        },
        name: 'suggestedTasks',
    }),
    tactics: defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors.Tactics,
        },
        name: 'tactics',
    }),
    graduation: defaultTheme.palette.augmentColor({
        color: {
            main: CategoryColors.Graduation,
        },
        name: 'graduation',
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

    ...Object.fromEntries(
        Object.values(RequirementCategory).map((c) => [c, augmentRequirementColor(c)]),
    ),
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
            <InitColorSchemeScript />
            {children}
        </Experimental_CssVarsProvider>
    );
};

export default ThemeProvider;
