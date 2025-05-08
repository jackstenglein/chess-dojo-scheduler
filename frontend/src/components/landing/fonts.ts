import { Anton, Barlow, Barlow_Condensed } from 'next/font/google';

export const anton = Anton({
    subsets: ['latin'],
    weight: '400',
    display: 'swap',
});

export const barlowCondensed = Barlow_Condensed({
    weight: ['300', '400', '500', '600'],
    display: 'swap',
    subsets: ['latin'],
});

export const barlow = Barlow({
    weight: '400',
    display: 'swap',
    subsets: ['latin'],
});
