import { useEffect } from 'react';

export function useWindowSizeEffect(handler: () => void) {
    useEffect(() => {
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [handler]);
}
