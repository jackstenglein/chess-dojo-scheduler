'use client';

import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { LicenseInfo } from '@mui/x-license';
import { ReactNode, useEffect, useState } from 'react';

LicenseInfo.setLicenseKey(
    '54bc84a7ecb1e4bb301846936cb75a56Tz03ODMxNixFPTE3MzExMDQzNDQwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI=',
);

export const LocalizationProvider = ({
    initialLang,
    children,
}: {
    initialLang: string | null;
    children: ReactNode;
}) => {
    const [lang, setLang] = useState(initialLang);

    useEffect(() => {
        setLang(navigator.languages[0]);
    }, [setLang]);

    return (
        <MuiLocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={lang}>
            {children}
        </MuiLocalizationProvider>
    );
};
