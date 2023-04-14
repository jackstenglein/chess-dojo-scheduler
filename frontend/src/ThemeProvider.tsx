import { ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/system';
import { createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useAuth } from './auth/Auth';

declare module '@mui/material/styles' {
    interface Theme {
        zIndex: {
            tooltip: number;
        };
    }
}

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const user = useAuth().user;
    const colorMode = user?.enableDarkMode ? 'dark' : 'light';

    const theme = useMemo(
        () =>
            createTheme({
                zIndex: {
                    tooltip: 1299,
                },
                palette: { mode: colorMode },
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
