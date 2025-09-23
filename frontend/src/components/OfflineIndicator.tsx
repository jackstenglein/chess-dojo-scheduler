'use client';

import { useEffect, useState } from 'react';

export function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [showBackOnline, setShowBackOnline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowBackOnline(true);
            setTimeout(() => setShowBackOnline(false), 3000);
        };
        
        const handleOffline = () => {
            setIsOffline(true);
            setShowBackOnline(false);
        };

        // Set initial status
        setIsOffline(!navigator.onLine);

        // Add event listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <>
            {/* Offline Banner */}
            {isOffline && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                        color: 'white',
                        padding: '16px 20px',
                        textAlign: 'center',
                        fontSize: '16px',
                        fontWeight: '600',
                        zIndex: 99999,
                        boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
                        borderBottom: '3px solid #d63031',
                        animation: 'slideDown 0.4s ease-out',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: '#fff',
                            animation: 'pulse 2s infinite'
                        }} />
                        <span>You are offline - Please check your internet connection</span>
                        <div style={{ 
                            width: '12px', 
                            height: '12px', 
                            borderRadius: '50%', 
                            backgroundColor: '#fff',
                            animation: 'pulse 2s infinite 0.5s'
                        }} />
                    </div>
                </div>
            )}

            {/* Back Online Banner */}
            {showBackOnline && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                        color: 'white',
                        padding: '16px 20px',
                        textAlign: 'center',
                        fontSize: '16px',
                        fontWeight: '600',
                        zIndex: 99999,
                        boxShadow: '0 4px 20px rgba(0, 184, 148, 0.4)',
                        borderBottom: '3px solid #00a085',
                        animation: 'slideDown 0.4s ease-out',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span>✅</span>
                        <span>Back online! Fresh content loading...</span>
                        <span>✅</span>
                    </div>
                </div>
            )}

            {/* Spacer to prevent content overlap */}
            {(isOffline || showBackOnline) && (
                <div style={{ height: '60px', width: '100%' }} />
            )}

            {/* CSS Animations */}
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
                `
            }} />
        </>
    );
}
