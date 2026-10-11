import { Check, Close } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';

/** How one puzzle of the session went. */
export interface PuzzleResult {
    id: string;
    /** The puzzle's rating, shown under its mark, if it has one. */
    rating?: number;
    /** Whether it was solved with no mistake and no move shown. */
    ok: boolean;
}

/**
 * The session so far as a row of marks, like a puzzle rush: a green tick for each puzzle solved
 * cleanly and a red cross for each that was not, with the puzzle's rating under it. The streak, the
 * run of ticks at the end, is the big number beside it.
 */
export function RushResults({ results, streak }: { results: PuzzleResult[]; streak: number }) {
    return (
        <Stack
            aria-label='Puzzles this session'
            sx={{
                gap: 1.25,
                px: 1.5,
                py: 1.25,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1.5,
            }}
        >
            <Stack direction='row' sx={{ alignItems: 'baseline', gap: 1 }}>
                <Typography
                    sx={{
                        fontSize: '2rem',
                        fontWeight: 800,
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {streak}
                </Typography>
                <Typography
                    variant='overline'
                    sx={{ color: 'text.secondary', lineHeight: 1.4, letterSpacing: '0.06em' }}
                >
                    in a row
                </Typography>
            </Stack>
            {results.length > 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        maxHeight: 190,
                        overflowY: 'auto',
                    }}
                >
                    {results.map((result, i) => (
                        <Stack
                            key={`${result.id}-${i}`}
                            aria-label={`${result.ok ? 'Solved' : 'Missed'}${result.rating !== undefined ? ` ${result.rating}` : ''}`}
                            sx={{ alignItems: 'center', width: 36 }}
                        >
                            <Box
                                sx={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 0.75,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: result.ok ? 'success.main' : 'error.main',
                                    color: '#fff',
                                }}
                            >
                                {result.ok ? (
                                    <Check sx={{ fontSize: 16 }} />
                                ) : (
                                    <Close sx={{ fontSize: 16 }} />
                                )}
                            </Box>
                            {result.rating !== undefined && (
                                <Typography
                                    sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: 600,
                                        lineHeight: 1.3,
                                        fontVariantNumeric: 'tabular-nums',
                                        color: result.ok ? 'success.main' : 'error.main',
                                    }}
                                >
                                    {result.rating}
                                </Typography>
                            )}
                        </Stack>
                    ))}
                </Box>
            )}
        </Stack>
    );
}
