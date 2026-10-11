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

/** One cell of a strip: a small label over a number, centered. */
function Cell({
    label,
    value,
    color,
    muted,
}: {
    label: string;
    value: ReactNode;
    color?: string;
    /** Quieter and smaller, for the averages. */
    muted?: boolean;
}) {
    return (
        <Stack sx={{ flex: 1, minWidth: 0, alignItems: 'center', py: muted ? 0.75 : 1.25 }}>
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
                    fontSize: muted ? '1.15rem' : '1.6rem',
                    fontWeight: muted ? 700 : 800,
                    lineHeight: 1.15,
                    fontVariantNumeric: 'tabular-nums',
                    color: color ?? (muted ? 'text.secondary' : undefined),
                }}
            >
                {value}
            </Typography>
        </Stack>
    );
}

/** A row of cells with thin lines between them, on a soft background. */
function Strip({ children, quiet }: { children: ReactNode; quiet?: boolean }) {
    return (
        <Stack
            direction='row'
            divider={<Divider orientation='vertical' flexItem sx={{ my: quiet ? 1 : 1.5 }} />}
            sx={{
                borderRadius: 2,
                bgcolor: quiet ? undefined : 'action.hover',
                border: quiet ? 1 : undefined,
                borderColor: 'divider',
            }}
        >
            {children}
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
    const average = scoring.average;
    // The time to compare with: what members really take, once enough have played it, and until
    // then the puzzle's own reference time.
    const par = average
        ? Math.round(average.thinkingMs / 1000)
        : scoring.referenceMs
          ? Math.round(scoring.referenceMs / 1000)
          : undefined;
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
            {/* The member's own numbers. */}
            <Strip>
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
            </Strip>
            {/* What members get on this puzzle on average, apart from the above. */}
            {average && (
                <>
                    <Typography
                        variant='overline'
                        color='text.secondary'
                        sx={{ textAlign: 'center', lineHeight: 1.4, mt: 0.5 }}
                    >
                        Average of members
                    </Typography>
                    <Strip quiet>
                        <Cell
                            muted
                            label='Accuracy'
                            value={`${Math.round(average.accuracy * 100)}%`}
                        />
                        <Cell muted label='Speed' value={formatSpeed(average.speed)} />
                        <Cell muted label='Score' value={Math.round(average.score * 100)} />
                    </Strip>
                </>
            )}
            <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center' }}>
                {par === undefined
                    ? 'Time is not counted for this puzzle yet.'
                    : `Took ${formatClock(seconds)} · average ${formatClock(par)}`}
            </Typography>
        </Stack>
    );
}
