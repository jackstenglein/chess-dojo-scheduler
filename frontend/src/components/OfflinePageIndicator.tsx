'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Slide } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';

export function OfflinePageIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [showBackOnline, setShowBackOnline] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const updateOnlineStatus = () => {
            const offline = !navigator.onLine;
            
            // If we were offline and now we're online, show back online message
            if (wasOffline && !offline) {
                setShowBackOnline(true);
                setTimeout(() => setShowBackOnline(false), 3000);
            }
            
            setIsOffline(offline);
            
            if (offline) {
                setWasOffline(true);
            }
        };

        // Set initial status
        updateOnlineStatus();

        // Add event listeners
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, [wasOffline]);

    return (
        <>
            {/* Offline Indicator */}
            <Slide direction="down" in={isOffline} mountOnEnter unmountOnExit>
                <Alert
                    severity="warning"
                    icon={<WifiOff />}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1400, // Above navbar
                        borderRadius: 0,
                        '& .MuiAlert-message': {
                            width: '100%',
                            textAlign: 'center',
                            fontWeight: 600,
                        },
                    }}
                >
                    You're viewing this page in offline mode - Using cached content
                </Alert>
            </Slide>

            {/* Back Online Indicator */}
            <Slide direction="down" in={showBackOnline} mountOnEnter unmountOnExit>
                <Alert
                    severity="success"
                    icon={<Wifi />}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1400,
                        borderRadius: 0,
                        '& .MuiAlert-message': {
                            width: '100%',
                            textAlign: 'center',
                            fontWeight: 600,
                        },
                    }}
                >
                    Back online! Fresh content will load automatically
                </Alert>
            </Slide>

            {/* Spacer when offline indicator is shown */}
            {isOffline && (
                <Box sx={{ height: '48px', width: '100%' }} />
            )}
        </>
    );
}
