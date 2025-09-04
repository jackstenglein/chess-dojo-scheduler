'use client';

import { useEffect, useState } from 'react';

/**
 * ServiceWorkerProvider - Handles service worker registration and lifecycle
 * Also includes offline indicator functionality
 */
export function ServiceWorkerProvider() {
    const [isOffline, setIsOffline] = useState(false);
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            void registerServiceWorker();
        }

        // Handle online/offline status
        const updateOnlineStatus = () => {
            const offline = !navigator.onLine;
            setIsOffline(offline);
            setDebugInfo(offline ? 'OFFLINE MODE ACTIVE' : 'ONLINE MODE');
            console.log('Network status changed:', offline ? 'OFFLINE' : 'ONLINE');
        };
        
        // Set initial status
        updateOnlineStatus();
        
        // Add event listeners
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Debug: Log every 5 seconds
        const debugInterval = setInterval(() => {
            console.log('SW Debug - Online:', navigator.onLine, 'Offline indicator showing:', isOffline);
        }, 5000);
        
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            clearInterval(debugInterval);
        };
    }, [isOffline]);

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            // Handle service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is available
                            console.log('New service worker available');
                            // You could show a notification to the user here
                        }
                    });
                }
            });

            console.log('Service Worker registered successfully:', registration.scope);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    };

    // Always render the component, show indicator when offline
    return (
        <>
            {isOffline && (
                <>
                    <div 
                        id="offline-indicator"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--mui-palette-error-main, #f44336)',
                            color: 'var(--mui-palette-error-contrastText, white)',
                            padding: '15px 20px',
                            textAlign: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            zIndex: 99999,
                            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.5)',
                            borderBottom: '3px solid var(--mui-palette-error-dark, #d32f2f)'
                        }}
                    >
                        🔴 OFFLINE MODE - Navigation cached, but some features limited | {debugInfo}
                    </div>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            #offline-indicator {
                                animation: pulse 2s infinite;
                            }
                            @keyframes pulse {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.8; }
                            }
                        `
                    }} />
                </>
            )}
        </>
    );
}