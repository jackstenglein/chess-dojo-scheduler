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

    return (
        <Stack alignItems='center' sx={{ pb: 1 }}>
            <Divider sx={{ width: 1, mb: 2 }} />
            <Typography>Great job memorizing this game!</Typography>
            <Button sx={{ mt: 1 }} onClick={() => solitaire?.start(null)}>
                Restart
            </Button>
        </Stack>
    );
}
