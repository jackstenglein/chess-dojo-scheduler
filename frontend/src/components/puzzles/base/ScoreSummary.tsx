'use client';

import { AttemptScoring } from '@jackstenglein/chess-dojo-common/src/puzzlebase/scoring';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
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

/** A small tile: a label, a number, and a line of detail under it. */
function Tile({
    label,
    value,
    detail,
    wide,
    color,
}: {
    label: string;
    value: ReactNode;
    detail?: ReactNode;
    /** Takes more room than the others, for a tile with details to fit. */
    wide?: boolean;
    /** The color of the number, if it should say something. */
    color?: string;
}) {
    return (
        <Box
            sx={{
                flex: wide ? 1.6 : 1,
                minWidth: 0,
                px: 1.25,
                py: 1,
                borderRadius: 1.5,
                bgcolor: 'action.hover',
            }}
        >
            <Typography
                variant='overline'
                sx={{
                    color: 'text.secondary',
                    lineHeight: 1.4,
                    display: 'block',
                    fontSize: '0.65rem',
                    letterSpacing: '0.06em',
                }}
            >
                {label}
            </Typography>
            <Typography
                sx={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    fontVariantNumeric: 'tabular-nums',
                    color,
                }}
            >
                {value}
            </Typography>
            {detail}
        </Box>
    );
}

/** One line under a tile: a label at the left and a time at the right. */
function TimeRow({ label, time }: { label: string; time: string }) {
    return (
        <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography variant='caption' color='text.secondary'>
                {label}
            </Typography>
            <Typography
                variant='body2'
                sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
            >
                {time}
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
            <Stack direction='row' sx={{ gap: 1, flexWrap: 'wrap' }}>
                <Tile label='Accuracy' value={`${Math.round(scoring.accuracy * 100)}%`} />
                <Tile
                    wide
                    label='Speed'
                    value={par === undefined ? '—' : `${Math.round(scoring.speed * 100)}%`}
                    // Green at full speed, amber once it costs more than a little.
                    color={
                        par === undefined
                            ? undefined
                            : scoring.speed >= 0.995
                              ? 'success.main'
                              : scoring.speed < 0.85
                                ? 'warning.main'
                                : undefined
                    }
                    detail={
                        par === undefined ? (
                            <Typography
                                variant='caption'
                                color='text.secondary'
                                sx={{ display: 'block' }}
                            >
                                not counted yet
                            </Typography>
                        ) : (
                            <Stack sx={{ mt: 0.5, gap: 0.25 }}>
                                <TimeRow label='Your time' time={formatClock(seconds)} />
                                <TimeRow label='Average' time={formatClock(par)} />
                            </Stack>
                        )
                    }
                />
                <Tile label='Score' value={Math.round(scoring.score * 100)} />
            </Stack>
        </Stack>
    );
}
