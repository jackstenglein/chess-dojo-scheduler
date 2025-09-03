import { useChess } from '@/board/pgn/PgnBoard';
import { InProgressAfterPgnText } from '@/board/pgn/solitaire/SolitaireAfterPgnText';
import { Button, Divider, Stack, Typography } from '@mui/material';

export function AfterPgnText() {
    const { solitaire } = useChess();
    if (solitaire?.complete) {
        return <CompletedAfterPgnText />;
    }
    return <InProgressAfterPgnText />;
}

function CompletedAfterPgnText() {
    const { solitaire } = useChess();
    if (!solitaire) {
        return;
    }

    const white = solitaire.results.white;
    const black = solitaire.results.black;

    const totalMoves = white.total + black.total;
    const totalPercentage =
        totalMoves === 0 ? 0 : Math.round((100 * (white.correct + black.correct)) / totalMoves);

    return (
        <Stack alignItems='center' sx={{ pb: 1 }}>
            <Divider sx={{ width: 1, mb: 2 }} />
            <Typography>Great job memorizing this game!</Typography>
            <Typography sx={{ mt: 1 }}>
                You guessed {white.correct + black.correct}/{totalMoves} move
                {totalMoves !== 1 ? 's' : ''} correctly ({totalPercentage}%).
            </Typography>
            {solitaire.playAs === 'both' && (
                <>
                    <Typography>
                        As white, you guessed {white.correct}/{white.total} move
                        {white.total !== 1 ? 's' : ''} correctly (
                        {white.total === 0 ? 0 : Math.round((100 * white.correct) / white.total)}
                        %).
                    </Typography>
                    <Typography>
                        As black, you guessed {black.correct}/{black.total} move
                        {black.total !== 1 ? 's' : ''} correctly (
                        {black.total === 0 ? 0 : Math.round((100 * black.correct) / black.total)}
                        %).
                    </Typography>
                </>
            )}

            <Button sx={{ mt: 1 }} onClick={() => solitaire?.start(null)}>
                Restart
            </Button>
        </Stack>
    );
}
