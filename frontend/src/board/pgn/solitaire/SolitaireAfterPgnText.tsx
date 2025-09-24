import { EventType } from '@jackstenglein/chess';
import { Button, Divider, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useChess } from '../PgnBoard';

export function SolitareAfterPgnText() {
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
        <Stack alignItems='center' sx={{ pb: 1, textAlign: 'center' }}>
            <Divider sx={{ width: 1, mb: 2 }} />
            <Typography>Great job completing this game!</Typography>
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

            <Stack direction='row' sx={{ mt: 1 }}>
                <Button onClick={() => solitaire?.start(null)}>Restart</Button>
                <Button onClick={solitaire?.stop}>Exit Solitaire Mode</Button>
            </Stack>
        </Stack>
    );
}

export function InProgressAfterPgnText() {
    const { chess, board, solitaire } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        const observer = {
            types: [EventType.LegalMove],
            handler: () => setForceRender((v) => v + 1),
        };
        chess?.addObserver(observer);
        return () => chess?.removeObserver(observer);
    }, [chess, setForceRender]);

    const onHint = (type: 'hint' | 'answer') => {
        const move = chess?.nextMove(solitaire?.currentMove);
        if (!move) {
            return;
        }

        board?.set({
            drawable: {
                shapes:
                    type === 'hint'
                        ? [{ orig: move.from, brush: 'red' }]
                        : [{ orig: move.from, dest: move.to, brush: 'red' }],
                eraseOnClick: false,
            },
        });
    };

    return (
        <Stack>
            <Divider sx={{ width: 1 }} />
            <Stack direction='row' sx={{ my: 1, px: 1 }}>
                <Button disabled={solitaire?.complete} onClick={() => onHint('hint')}>
                    Hint
                </Button>
                <Button disabled={solitaire?.complete} onClick={() => onHint('answer')}>
                    Show Answer
                </Button>
            </Stack>
        </Stack>
    );
}
