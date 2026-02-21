import { ChessDbMove } from '@/api/cache/chessdb';
import { Box, Button, CircularProgress, Stack, Tooltip, Typography } from '@mui/material';
import { useReconcile } from '../../Board';
import { useChess } from '../PgnBoard';

interface ChessDBTabProps {
    moves: ChessDbMove[];
    loading: boolean;
    error: string | null;
    requestAnalysis: () => void;
    fen: string;
}

export function ChessDBTab({ moves, loading, error, requestAnalysis }: ChessDBTabProps) {
    const { chess } = useChess();
    const reconcile = useReconcile();

    if (loading) return <CircularProgress sx={{ mt: 2 }} />;

    if (error)
        return (
            <Stack mt={2} spacing={1} alignItems='center'>
                <Typography color='error'>{error}</Typography>
                <Button onClick={requestAnalysis} variant='outlined' size='small'>
                    Queue Analysis
                </Button>
            </Stack>
        );

    if (moves.length === 0)
        return (
            <Stack mt={2} spacing={1} alignItems='center'>
                <Typography>Position not in ChessDB.</Typography>
                <Button onClick={requestAnalysis} variant='outlined' size='small'>
                    Queue Analysis
                </Button>
            </Stack>
        );

    const bestMove = moves[0];
    const totalGames = moves.length;

    return (
        <Stack mt={2} spacing={1}>
            {moves.map((move, i) => {
                const widthPct =
                    totalGames > 0 ? Math.max(10, ((totalGames - i) / totalGames) * 100) : 0;

                return (
                    <Tooltip
                        key={move.uci}
                        title={`Score: ${move.score} | Winrate: ${move.winrate}% | Note: ${move.note}`}
                    >
                        <Box
                            onClick={() => {
                                chess?.move(move.san);
                                reconcile();
                            }}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                p: 0.5,
                                borderRadius: 1,
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <Typography
                                sx={{ minWidth: 50, fontWeight: move === bestMove ? 700 : 400 }}
                            >
                                {move.san}
                            </Typography>
                            <Box sx={{ flex: 1, bgcolor: 'divider', borderRadius: 1, height: 8 }}>
                                <Box
                                    sx={{
                                        width: `${widthPct}%`,
                                        bgcolor: 'primary.main',
                                        height: '100%',
                                        borderRadius: 1,
                                    }}
                                />
                            </Box>
                            <Typography
                                sx={{ minWidth: 45, textAlign: 'right', fontSize: '0.8rem' }}
                            >
                                {move.score}
                            </Typography>
                            <Typography
                                sx={{
                                    minWidth: 40,
                                    textAlign: 'right',
                                    fontSize: '0.8rem',
                                    color: 'text.secondary',
                                }}
                            >
                                {move.winrate}%
                            </Typography>
                        </Box>
                    </Tooltip>
                );
            })}
        </Stack>
    );
}
