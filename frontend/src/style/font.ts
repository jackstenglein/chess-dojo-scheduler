import { Theme } from '@mui/material';
import { NextFont } from 'next/dist/compiled/@next/font';

export function fontFamily(theme: Theme, fontFamily: NextFont): string {
    return `${fontFamily.style.fontFamily},${theme.typography.fontFamily}`;
}
