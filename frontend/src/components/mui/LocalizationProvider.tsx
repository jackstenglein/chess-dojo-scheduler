'use client';

import { MUI_LICENSE_KEY } from '@/config';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { LicenseInfo } from '@mui/x-license';
import { ReactNode, useEffect, useState } from 'react';

LicenseInfo.setLicenseKey(MUI_LICENSE_KEY);

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState('');

    useEffect(() => {
        setLang(navigator.languages[0]);
    }, [setLang]);

    return (
        <MuiLocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={lang}>
            {children}
        </MuiLocalizationProvider>
    );
};
