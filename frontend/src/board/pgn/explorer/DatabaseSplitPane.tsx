import { Box } from '@mui/material';
import {
    KeyboardEvent,
    ReactNode,
    PointerEvent as ReactPointerEvent,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useLocalStorage } from 'usehooks-ts';

const DEFAULT_SPLIT_RATIO = 0.5;
const MIN_SPLIT_RATIO = 0.25;
const MAX_SPLIT_RATIO = 0.8;
const KEYBOARD_STEP = 0.05;
const HANDLE_HEIGHT = 12;
const MIN_MOVE_STATS_HEIGHT = 112;

export function normalizeSplitRatio(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return DEFAULT_SPLIT_RATIO;
    }
    return Math.min(MAX_SPLIT_RATIO, Math.max(MIN_SPLIT_RATIO, value));
}

export function calculateSplitRatio(
    clientY: number,
    containerTop: number,
    containerHeight: number,
) {
    const availableHeight = containerHeight - HANDLE_HEIGHT;
    if (availableHeight <= 0) {
        return DEFAULT_SPLIT_RATIO;
    }

    return normalizeSplitRatio((clientY - containerTop - HANDLE_HEIGHT / 2) / availableHeight);
}

interface DatabaseSplitPaneProps {
    storageKey: string;
    resizeLabel: string;
    top: ReactNode;
    bottom: ReactNode;
}

export function DatabaseSplitPane({
    storageKey,
    resizeLabel,
    top,
    bottom,
}: DatabaseSplitPaneProps) {
    const [storedRatio, setStoredRatio] = useLocalStorage(storageKey, DEFAULT_SPLIT_RATIO);
    const [ratio, setRatio] = useState(() => normalizeSplitRatio(storedRatio));
    const ratioRef = useRef(ratio);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        if (!isDraggingRef.current) {
            const nextRatio = normalizeSplitRatio(storedRatio);
            ratioRef.current = nextRatio;
            setRatio(nextRatio);
        }
    }, [storedRatio]);

    const updateRatio = (nextRatio: number) => {
        ratioRef.current = nextRatio;
        setRatio(nextRatio);
    };

    const updateRatioFromPointer = (clientY: number) => {
        const bounds = containerRef.current?.getBoundingClientRect();
        if (!bounds) {
            return;
        }
        updateRatio(calculateSplitRatio(clientY, bounds.top, bounds.height));
    };

    const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        isDraggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateRatioFromPointer(event.clientY);
    };

    const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (isDraggingRef.current) {
            updateRatioFromPointer(event.clientY);
        }
    };

    const finishDrag = () => {
        if (!isDraggingRef.current) {
            return;
        }
        isDraggingRef.current = false;
        setStoredRatio(ratioRef.current);
    };

    const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        updateRatioFromPointer(event.clientY);
        finishDrag();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        let nextRatio: number | undefined;
        switch (event.key) {
            case 'ArrowUp':
                nextRatio = ratioRef.current - KEYBOARD_STEP;
                break;
            case 'ArrowDown':
                nextRatio = ratioRef.current + KEYBOARD_STEP;
                break;
            case 'Home':
                nextRatio = MIN_SPLIT_RATIO;
                break;
            case 'End':
                nextRatio = MAX_SPLIT_RATIO;
                break;
            default:
                return;
        }

        event.preventDefault();
        const normalizedRatio = normalizeSplitRatio(nextRatio);
        updateRatio(normalizedRatio);
        setStoredRatio(normalizedRatio);
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                display: 'grid',
                gridTemplateRows: `minmax(${MIN_MOVE_STATS_HEIGHT}px, ${ratio * 100}fr) ${HANDLE_HEIGHT}px minmax(0, ${(1 - ratio) * 100}fr)`,
                height: 1,
                minHeight: 0,
            }}
        >
            <Box sx={{ minHeight: 0, overflow: 'hidden' }}>{top}</Box>

            <Box
                role='separator'
                aria-label={resizeLabel}
                aria-orientation='horizontal'
                aria-valuemin={MIN_SPLIT_RATIO * 100}
                aria-valuemax={MAX_SPLIT_RATIO * 100}
                aria-valuenow={Math.round(ratio * 100)}
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={finishDrag}
                onLostPointerCapture={finishDrag}
                onKeyDown={onKeyDown}
                sx={{
                    position: 'relative',
                    cursor: 'row-resize',
                    touchAction: 'none',
                    outline: 'none',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 40,
                        height: 3,
                        borderRadius: 1,
                        backgroundColor: 'divider',
                        transform: 'translate(-50%, -50%)',
                    },
                    '&:hover::before, &:focus-visible::before': {
                        backgroundColor: 'primary.main',
                    },
                }}
            />

            <Box sx={{ minHeight: 0, overflow: 'auto' }}>{bottom}</Box>
        </Box>
    );
}
