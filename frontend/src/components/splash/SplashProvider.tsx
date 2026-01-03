'use client';

import { useEffect, useState } from 'react';
import { SplashScreen } from './SplashScreen';

interface SplashProviderProps {
    children: React.ReactNode;
}

export function SplashProvider({ children }: SplashProviderProps) {
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Show splash screen for at least 1.5 seconds
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} duration={1500} />}
            {children}
        </>
    );
}
