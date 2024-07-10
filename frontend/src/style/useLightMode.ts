import { useColorScheme } from '@mui/material';

export function useLightMode(): boolean {
    const { mode } = useColorScheme();
    return mode === 'light';
}
