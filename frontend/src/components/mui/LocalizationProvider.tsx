'use client';

import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { LicenseInfo } from '@mui/x-license';
import { ReactNode } from 'react';

LicenseInfo.setLicenseKey(
    '54bc84a7ecb1e4bb301846936cb75a56Tz03ODMxNixFPTE3MzExMDQzNDQwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI=',
);

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
    return (
        <MuiLocalizationProvider
            dateAdapter={AdapterLuxon}
            adapterLocale={navigator.languages[0]}
        >
            {children}
        </MuiLocalizationProvider>
    );
};
