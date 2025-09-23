'use client';

import { useEffect, useState } from 'react';

/**
 * ServiceWorkerProvider - Handles service worker registration and lifecycle
 * Also includes offline indicator functionality
 */
export function ServiceWorkerProvider() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            void registerServiceWorker();
        }

        // Handle online/offline status
        const updateOnlineStatus = () => {
            const offline = !navigator.onLine;
            setIsOffline(offline);
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
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                            color: 'white',
                            padding: '12px 20px',
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: '600',
                            zIndex: 99999,
                            boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
                            borderBottom: '3px solid #d63031',
                            animation: 'slideDown 0.4s ease-out',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '8px',
                            maxWidth: '1200px',
                            margin: '0 auto'
                        }}>
                            <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: '#fff',
                                animation: 'pulse 2s infinite'
                            }} />
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>
                                You are offline - Please check your internet connection.
                            </span>
                            <div style={{ 
                                width: '12px', 
                                height: '12px', 
                                borderRadius: '50%', 
                                backgroundColor: '#fff',
                                animation: 'pulse 2s infinite 0.5s'
                            }} />
                        </div>
                    </div>
                    
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            @keyframes slideDown {
                                from {
                                    transform: translateY(-100%);
                                    opacity: 0;
                                }
                                to {
                                    transform: translateY(0);
                                    opacity: 1;
                                }
                            }
                            
                            @keyframes pulse {
                                0%, 100% { 
                                    opacity: 1;
                                    transform: scale(1);
                                }
                                50% { 
                                    opacity: 0.6;
                                    transform: scale(0.8);
                                }
                            }
                            
                            @keyframes shimmer {
                                0% { background-position: -200px 0; }
                                100% { background-position: calc(200px + 100%) 0; }
                            }
                            
                            #offline-indicator {
                                background-size: 200px 100%;
                                background-image: linear-gradient(
                                    90deg,
                                    transparent,
                                    rgba(255, 255, 255, 0.2),
                                    transparent
                                );
                                animation: shimmer 3s infinite;
                            }
                            
                            @media (max-width: 768px) {
                                #offline-indicator {
                                    padding: 10px 16px;
                                    font-size: 14px;
                                }
                                
                                #offline-indicator span {
                                    font-size: 13px !important;
                                }
                                
                                #offline-indicator div {
                                    width: 10px !important;
                                    height: 10px !important;
                                }
                            }
                            
                            @media (max-width: 480px) {
                                #offline-indicator {
                                    padding: 8px 12px;
                                    font-size: 13px;
                                }
                                
                                #offline-indicator span {
                                    font-size: 12px !important;
                                }
                                
                                #offline-indicator div {
                                    width: 8px !important;
                                    height: 8px !important;
                                }
                            }
                            
                            /* Add padding to body when offline indicator is shown */
                            body:has(#offline-indicator) {
                                padding-top: 60px !important;
                            }
                            
                            @media (max-width: 768px) {
                                body:has(#offline-indicator) {
                                    padding-top: 50px !important;
                                }
                            }
                            
                            @media (max-width: 480px) {
                                body:has(#offline-indicator) {
                                    padding-top: 45px !important;
                                }
                            }
                        `
                    }} />
                </>
            )}
        </>
    );
}