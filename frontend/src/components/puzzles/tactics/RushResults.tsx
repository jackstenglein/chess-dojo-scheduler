import { Close } from '@mui/icons-material';
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
 * The session so far as a row of marks, like a puzzle rush: a green square for each puzzle solved
 * cleanly and a red cross for each that was not, with the puzzle's rating under it.
 */
export function RushResults({ results }: { results: PuzzleResult[] }) {
    if (results.length === 0) return null;
    return (
        <Box
            aria-label='Puzzles this session'
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                columnGap: 1,
                rowGap: 1.25,
                maxHeight: 230,
                overflowY: 'auto',
            }}
        >
            {results.map((result, i) => (
                <Stack
                    key={`${result.id}-${i}`}
                    aria-label={`${result.ok ? 'Solved' : 'Missed'}${result.rating !== undefined ? ` ${result.rating}` : ''}`}
                    sx={{ alignItems: 'center', width: 40 }}
                >
                    <Box
                        sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 0.75,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: result.ok ? 'success.main' : 'error.main',
                            color: '#fff',
                        }}
                    >
                        {!result.ok && <Close sx={{ fontSize: 20 }} />}
                    </Box>
                    {result.rating !== undefined && (
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                lineHeight: 1.4,
                                fontVariantNumeric: 'tabular-nums',
                                color: result.ok ? 'text.secondary' : 'error.main',
                            }}
                        >
                            {result.rating}
                        </Typography>
                    )}
                </Stack>
            ))}
        </Box>
    );
}
