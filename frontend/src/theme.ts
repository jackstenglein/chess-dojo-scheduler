import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface Theme {
        zIndex: {
            tooltip: number;
        };
    }
}

const theme = createTheme({
    zIndex: {
        tooltip: 1299,
    },
});

export default theme;
