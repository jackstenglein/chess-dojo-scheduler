'use client';

import { useAuth } from '@/auth/Auth';
import { useColorScheme } from '@mui/material';
import { useEffect } from 'react';

export function ColorModeSetter() {
    const user = useAuth().user;
    const { setMode } = useColorScheme();

    useEffect(() => {
        if (user) {
            setMode(user.enableLightMode ? 'light' : 'dark');
        }
    }, [setMode, user]);

    return null;
}
