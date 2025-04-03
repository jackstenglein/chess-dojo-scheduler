import { reconcile } from '@/board/Board';
import { useChess } from '@/board/pgn/PgnBoard';
import { Chess, EventType } from '@jackstenglein/chess';
import { Button, Divider, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

interface AfterPgnTextProps {
    solution: React.RefObject<Chess | undefined>;
    /** Whether the user has completed the puzzle or game memorization. */
    isComplete: boolean;
    /** Callback invoked to reset after completing the puzzle. */
    onReset: () => void;
}

export function AfterPgnText(props: AfterPgnTextProps) {
    if (props.isComplete) {
        return <CompletedAfterPgnText {...props} />;
    }
    return <InProgressAfterPgnText {...props} />;
}

function InProgressAfterPgnText(props: AfterPgnTextProps) {
    const { chess, board } = useChess();
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
        const move = props.solution.current?.nextMove();
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
                <Button
                    disabled={
                        Boolean(chess?.history().length) &&
                        chess?.currentMove() !== chess?.history().at(-1)
                    }
                    onClick={() => onHint('hint')}
                >
                    Hint
                </Button>
                <Button
                    disabled={
                        Boolean(chess?.history().length) &&
                        chess?.currentMove() !== chess?.history().at(-1)
                    }
                    onClick={() => onHint('answer')}
                >
                    Show Answer
                </Button>
            </Stack>
        </Stack>
    );
}

function CompletedAfterPgnText({ onReset }: AfterPgnTextProps) {
    const { chess, board } = useChess();

    const handleReset = () => {
        chess?.seek(null);
        chess?.delete(chess.firstMove());
        reconcile(chess, board, false);
        onReset();
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
