'use client';

import { Box, keyframes } from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;


interface SplashScreenProps {
    onComplete?: () => void;
    duration?: number;
}

export function SplashScreen({ onComplete, duration = 2000 }: SplashScreenProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => {
                onComplete?.();
            }, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    if (!isVisible) {
        return null;
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: '#1e3c72',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: `${fadeIn} 0.5s ease-in-out`,
            }}
        >
            {/* Animated logo - using android-chrome-512x512.png as before */}
            <Box
                sx={{
                    animation: `${pulse} 2s ease-in-out infinite`,
                    mb: 4,
                }}
            >
                <Image
                    src="/android-chrome-512x512.png"
                    alt="Chess Dojo"
                    width={150}
                    height={150}
                    priority
                />
            </Box>

            {/* App name */}
            <Box
                sx={{
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 600,
                    mb: 2,
                    textAlign: 'center',
                }}
            >
                Chess Dojo
            </Box>

            {/* Subtitle */}
            <Box
                sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '1.1rem',
                    textAlign: 'center',
                    maxWidth: '300px',
                }}
            >
                Train chess with the Chess Dojo community
            </Box>

            {/* Loading indicator */}
            <Box
                sx={{
                    mt: 4,
                    width: '40px',
                    height: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'white',
                        borderRadius: '2px',
                        animation: `${pulse} 1.5s ease-in-out infinite`,
                    }}
                />
            </Box>
        </Box>
    );
}
