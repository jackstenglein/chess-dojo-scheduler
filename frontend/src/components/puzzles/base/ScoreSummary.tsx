'use client';

import { AttemptScoring } from '@jackstenglein/chess-dojo-common/src/puzzlebase/scoring';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Box, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';
import { formatClock } from '../tactics/tacticsPuzzles';

interface ScoreSummaryProps {
    /** How the attempt was scored. Undefined while the server is still working it out. */
    scoring?: AttemptScoring;
    /** Whether saving the attempt failed, so there is nothing to show. */
    failed?: boolean;
}

/** The sign and size of a rating change, like +6.4 or −3.1. */
export function formatDelta(delta: number): string {
    const rounded = Math.round(delta * 10) / 10;
    if (rounded === 0) return '±0';
    return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(1)}`;
}

/** The speed factor as a plain number, to two places without trailing zeros: 0.7, 0.92, 1. */
export function formatSpeed(speed: number): string {
    return String(Number(speed.toFixed(2)));
}

/** One cell of the strip: a small label over a number, centered. */
function Cell({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
    return (
        <Stack sx={{ flex: 1, minWidth: 0, alignItems: 'center', py: 1.25 }}>
            <Typography
                variant='overline'
                sx={{
                    color: 'text.secondary',
                    lineHeight: 1.4,
                    fontSize: '0.65rem',
                    letterSpacing: '0.08em',
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    fontVariantNumeric: 'tabular-nums',
                    color,
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

/**
 * What a puzzle did to the member's tactics rating, laid out as tiles: the new rating and the
 * change in a colored plate, then accuracy, speed and score. Shown on the result of every puzzle.
 */
export function ScoreSummary({ scoring, failed }: ScoreSummaryProps) {
    if (failed) {
        return (
            <Typography variant='body2' color='text.secondary'>
                This puzzle could not be scored.
            </Typography>
        );
    }
    if (!scoring) {
        return (
            <Stack aria-label='Scoring' sx={{ gap: 1 }}>
                <Skeleton variant='rounded' height={64} />
                <Stack direction='row' sx={{ gap: 1 }}>
                    <Skeleton variant='rounded' height={64} sx={{ flex: 1 }} />
                    <Skeleton variant='rounded' height={64} sx={{ flex: 1 }} />
                    <Skeleton variant='rounded' height={64} sx={{ flex: 1 }} />
                </Stack>
            </Stack>
        );
    }

    const seconds = Math.round(scoring.thinkingMs / 1000);
    const par = scoring.referenceMs ? Math.round(scoring.referenceMs / 1000) : undefined;
    const up = (scoring.delta ?? 0) > 0;
    const down = (scoring.delta ?? 0) < 0;
    const color = up ? 'success' : down ? 'error' : 'text';

    return (
        <Stack sx={{ gap: 1 }}>
            {scoring.counted && scoring.ratingAfter !== undefined && scoring.delta !== undefined ? (
                <Stack
                    direction='row'
                    sx={{
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        py: 1.25,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                    }}
                >
                    <Box>
                        <Typography
                            variant='overline'
                            sx={{ color: 'text.secondary', lineHeight: 1.4, display: 'block' }}
                        >
                            Tactics rating
                        </Typography>
                        <Typography
                            sx={{
                                fontSize: '2.25rem',
                                fontWeight: 800,
                                lineHeight: 1.1,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {Math.round(scoring.ratingAfter)}
                        </Typography>
                    </Box>
                    <Stack
                        direction='row'
                        sx={{
                            alignItems: 'center',
                            color: color === 'text' ? 'text.secondary' : `${color}.main`,
                        }}
                    >
                        {up && <ArrowDropUp fontSize='large' />}
                        {down && <ArrowDropDown fontSize='large' />}
                        <Typography
                            sx={{
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {formatDelta(scoring.delta)}
                        </Typography>
                    </Stack>
                </Stack>
            ) : (
                <Typography variant='body2' color='text.secondary'>
                    You have played this puzzle before, so it does not change your rating.
                </Typography>
            )}
            {/* One quiet strip: accuracy, speed and score, with how long it took beneath. */}
            <Stack
                direction='row'
                divider={<Divider orientation='vertical' flexItem sx={{ my: 1.5 }} />}
                sx={{ borderRadius: 2, bgcolor: 'action.hover' }}
            >
                <Cell label='Accuracy' value={`${Math.round(scoring.accuracy * 100)}%`} />
                <Cell
                    label='Speed'
                    value={par === undefined ? '—' : formatSpeed(scoring.speed)}
                    // Green at full speed, amber once it costs a lot.
                    color={
                        par === undefined
                            ? undefined
                            : scoring.speed >= 0.995
                              ? 'success.main'
                              : scoring.speed < 0.85
                                ? 'warning.main'
                                : undefined
                    }
                />
                <Cell label='Score' value={Math.round(scoring.score * 100)} />
            </Stack>
            <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center' }}>
                {par === undefined
                    ? 'Time is not counted for this puzzle yet.'
                    : `Took ${formatClock(seconds)} · average ${formatClock(par)}`}
            </Typography>
        </Stack>
    );
}
