'use client';

import { RequirementCategory } from '@/database/requirement';
import { Box, CssBaseline } from '@mui/material';
import { blue, deepPurple } from '@mui/material/colors';
import {
    ThemeProvider as MuiThemeProvider,
    PaletteColor,
    createTheme,
    useColorScheme,
} from '@mui/material/styles';
import { ReactNode, useEffect } from 'react';

export const CategoryColors: Record<RequirementCategory, string> = {
    [RequirementCategory.SuggestedTasks]: '#c27ba0',
    [RequirementCategory.Welcome]: '#c27ba0',
    [RequirementCategory.Games]: '#faa137',
    [RequirementCategory.Tactics]: '#82e356',
    [RequirementCategory.Middlegames]: '#5f5ffa',
    [RequirementCategory.Endgame]: '#916af7',
    [RequirementCategory.Opening]: '#f05b5b',
    [RequirementCategory.Graduation]: '#fc6156',
    [RequirementCategory.NonDojo]: '#dbdbdb',
    [RequirementCategory.Pinned]: '#c27ba0',
};

// Extremely degen stuff to force the type system to accept the result
// of themeRequirementCategory as a valid theme value.
// TODO: figure out a way to migrate this.
enum requirementCategoryOverrides {
    forceOverride = 'forceOverride',
}

// Extremely degen stuff to force the type system to accept the result
// of themeRequirementCategory as a valid theme value.
// TODO: figure out a way to migrate this.
type RequirementCategoryOverrides = {
    [key in requirementCategoryOverrides]?: true;
};

/**
 * Converts the given requirement category to a value that can be passed to
 * a MUI theme option.
 * @param category The category to convert.
 * @returns A value that can be passed to a MUI theme option.
 */
export function themeRequirementCategory(
    category: RequirementCategory,
): requirementCategoryOverrides {
    return category
        .toLowerCase()
        .replaceAll(/[^a-z]/g, '') as unknown as requirementCategoryOverrides;
}

type RequirementCategoryPalette = { [key in requirementCategoryOverrides]?: PaletteColor };

declare module '@mui/material/styles' {
    interface Palette extends RequirementCategoryPalette {
        opening: Palette['primary'];
        endgame: Palette['primary'];
        dojoOrange: Palette['primary'];
        subscribe: Palette['primary'];
        coaching: Palette['primary'];
        liga: Palette['primary'];
        book: Palette['primary'];
        meet: Palette['primary'];
        explorerTotal: Palette['primary'];
        trainingPlanTaskComplete: Palette['primary'];
    }
    interface PaletteOptions extends RequirementCategoryPalette {
        opening?: PaletteOptions['primary'];
        endgame?: Palette['primary'];
        dojoOrange?: PaletteOptions['primary'];
        subscribe?: PaletteOptions['primary'];
        coaching?: PaletteOptions['primary'];
        liga?: PaletteOptions['primary'];
        book?: Palette['primary'];
        meet?: Palette['primary'];
        explorerTotal?: Palette['primary'];
        trainingPlanTaskComplete?: Palette['primary'];
        DataGrid: {
            bg: string;
        };
    }
}

declare module '@mui/material' {
    interface ChipPropsColorOverrides extends RequirementCategoryOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
    }

    interface CheckboxPropsColorOverrides extends RequirementCategoryOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
        trainingPlanTaskComplete: true;
    }

    interface ButtonPropsColorOverrides extends RequirementCategoryOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
        darkBlue: true;
    }

    interface SvgIconPropsColorOverrides extends RequirementCategoryOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
        youtube: true;
        twitch: true;
        darkBlue: true;
    }
}

const defaultTheme = createTheme({});

const defaultPalette = {
    DataGrid: { bg: 'transparent' },
    meet: defaultTheme.palette.augmentColor({
        color: {
            main: '#93a84f',
        },
        name: 'meet',
    }),
    youtube: defaultTheme.palette.augmentColor({
        color: {
            main: '#FF0000',
        },
        name: 'youtube',
    }),
    twitch: defaultTheme.palette.augmentColor({
        color: {
            main: '#6441a5',
        },
        name: 'twitch',
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
    trainingPlanTaskComplete: defaultTheme.palette.augmentColor({
        color: {
            main: blue[800],
        },
        name: 'trainingPlanTaskComplete',
    }),
    darkBlue: defaultTheme.palette.augmentColor({
        color: {
            main: 'rgba(24, 117, 238, 1)',
        },
        name: 'darkBlue',
    }),
    ...Object.values(RequirementCategory).reduce<Record<string, PaletteColor>>((acc, category) => {
        acc[themeRequirementCategory(category)] = defaultTheme.palette.augmentColor({
            color: {
                main: CategoryColors[category],
            },
            name: themeRequirementCategory(category),
        });
        return acc;
    }, {}),
};

const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'class',
    },
    defaultColorScheme: 'dark',
    colorSchemes: {
        light: {
            palette: {
                ...defaultPalette,
                trainingPlanTaskComplete: defaultTheme.palette.augmentColor({
                    color: {
                        main: blue[400],
                    },
                    name: 'trainingPlanTaskComplete',
                }),
            },
        },
        dark: {
            palette: defaultPalette,
        },
    },
});

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <DefaultDarkModeSetter>
                <Box sx={{ '--navbar-height': { xs: '60px', md: '75px' } }}>{children}</Box>
            </DefaultDarkModeSetter>
        </MuiThemeProvider>
    );
};

const DefaultDarkModeSetter = ({ children }: { children: ReactNode }) => {
    const { mode, setMode } = useColorScheme();
    useEffect(() => {
        if (mode === 'system') {
            setMode('dark');
        }
    }, [mode, setMode]);
    return children;
};

export default ThemeProvider;
