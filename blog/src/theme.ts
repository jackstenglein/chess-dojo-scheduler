'use client';
import { createTheme } from '@mui/material';
import { Roboto } from 'next/font/google';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

const theme = createTheme({
    palette: {
        mode: 'dark',
    },
    typography: {
        fontFamily: roboto.style.fontFamily,
    },
});

export default theme;
