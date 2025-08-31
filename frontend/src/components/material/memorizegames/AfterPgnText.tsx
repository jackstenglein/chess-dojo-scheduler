import { reconcile } from '@/board/Board';
import { useChess } from '@/board/pgn/PgnBoard';
import { EventType } from '@jackstenglein/chess';
import { Button, Divider, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export function AfterPgnText() {
    const { solitaire } = useChess();
    if (solitaire?.complete) {
        return <CompletedAfterPgnText />;
    }
    return <InProgressAfterPgnText />;
}

function InProgressAfterPgnText() {
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

function CompletedAfterPgnText() {
    const { chess, board, solitaire } = useChess();

    const handleReset = () => {
        chess?.seek(null);
        reconcile(chess, board, false);
        solitaire?.start(null);
    };

    return (
        <Stack alignItems='center' sx={{ pb: 1 }}>
            <Divider sx={{ width: 1, mb: 1 }} />
            <Typography>Great job memorizing this game!</Typography>
            <Button sx={{ mt: 1 }} onClick={handleReset}>
                Reset
            </Button>
        </Stack>
    );
}
