import React, { useCallback, useEffect } from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { Move } from '@jackstenglein/chess';

import { BoardApi, toColor, Chess, reconcile } from '../Board';
import ChatBubble from './ChatBubble';
import { Status } from './PuzzleBoard';
import Coach from './Coach';
import PgnText from '../pgn/PgnText';
import { useCurrentMove } from '../pgn/PgnBoard';
import Tools from '../pgn/Tools';

interface HintSectionProps {
    status: Status;
    move: Move | null;
    board: BoardApi;
    chess: Chess;
    coachUrl?: string;
    onRestart: (board: BoardApi, chess: Chess) => void;
    onNext: (board: BoardApi, chess: Chess) => void;
    onRetry: (board: BoardApi, chess: Chess) => void;
}

const WaitingForMoveHint: React.FC<HintSectionProps> = ({ move, chess, coachUrl }) => {
    let comment = move ? move.commentAfter : chess.pgn.gameComment;
    if (!comment || comment.includes('[#]')) {
        comment = 'What would you play in this position?';
    }

    return (
        <>
            <ChatBubble>{comment}</ChatBubble>

            <Stack direction='row' alignItems='center' justifyContent='space-between'>
                <Stack>
                    <Typography variant='h6' fontWeight='bold' color='text.secondary'>
                        Your turn
                    </Typography>
                    <Typography color='text.secondary'>
                        Find the best move for {toColor(chess)}.
                    </Typography>
                </Stack>

                <Coach src={coachUrl} />
            </Stack>
        </>
    );
};

const IncorrectMoveHint: React.FC<HintSectionProps> = ({
    move,
    board,
    chess,
    coachUrl,
    onRetry,
}) => {
    const upHandler = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.stopPropagation();
                onRetry(board, chess);
            }
        },
        [onRetry, board, chess]
    );

    useEffect(() => {
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keyup', upHandler);
        };
    }, [upHandler]);

    return (
        <>
            <ChatBubble>
                {move?.commentAfter || 'Incorrect, please try again.'}
            </ChatBubble>
            <Stack direction='row' justifyContent='space-between'>
                <Button
                    variant='contained'
                    disableElevation
                    color='error'
                    sx={{ flexGrow: 1 }}
                    onClick={() => onRetry(board, chess)}
                >
                    Retry
                    <br />
                    (Enter)
                </Button>
                <Coach src={coachUrl} />
            </Stack>
        </>
    );
};

const CorrectMoveHint: React.FC<HintSectionProps> = ({
    move,
    board,
    chess,
    coachUrl,
    onNext,
}) => {
    const upHandler = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.stopPropagation();
                onNext(board, chess);
            }
        },
        [onNext, board, chess]
    );

    useEffect(() => {
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keyup', upHandler);
        };
    }, [upHandler]);

    return (
        <>
            <ChatBubble>{move?.commentAfter || 'Good move!'}</ChatBubble>
            <Stack direction='row' justifyContent='space-between'>
                <Button
                    variant='contained'
                    disableElevation
                    color='success'
                    sx={{ flexGrow: 1 }}
                    onClick={() => onNext(board, chess)}
                >
                    Next
                    <br />
                    (Enter)
                </Button>
                <Coach src={coachUrl} />
            </Stack>
        </>
    );
};

const CompleteHint: React.FC<HintSectionProps> = ({
    board,
    chess,
    coachUrl,
    onRestart,
}) => {
    const setMove = useCurrentMove().setMove;

    const onMove = useCallback(
        (move: Move | null) => {
            chess.seek(move);
            reconcile(chess, board);
            setMove(move);
        },
        [board, chess, setMove]
    );

    const onArrowKeys = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'ArrowRight') {
                const nextMove = chess.nextMove();
                if (nextMove !== null) {
                    onMove(nextMove);
                }
            } else if (event.key === 'ArrowLeft') {
                const prevMove = chess.previousMove();
                onMove(prevMove);
            }
        },
        [chess, onMove]
    );

    useEffect(() => {
        window.addEventListener('keyup', onArrowKeys);
        return () => {
            window.removeEventListener('keyup', onArrowKeys);
        };
    }, [onArrowKeys]);

    const toggleOrientation = useCallback(() => {
        board.toggleOrientation();
    }, [board]);

    const onFirstMove = () => {
        onMove(null);
    };

    const onPreviousMove = () => {
        onMove(chess.previousMove());
    };

    const onNextMove = () => {
        if (chess.nextMove()) {
            onMove(chess.nextMove());
        }
    };

    const onLastMove = () => {
        onMove(chess.lastMove());
    };

    return (
        <>
            <Stack flexGrow={1} spacing={1} sx={{ overflowY: 'hidden' }}>
                <Stack sx={{ overflowY: 'scroll' }}>
                    <PgnText pgn={chess.pgn} onClickMove={onMove} />
                </Stack>
                <Tools
                    pgn={chess.pgn.render()}
                    onFirstMove={onFirstMove}
                    onPreviousMove={onPreviousMove}
                    onNextMove={onNextMove}
                    onLastMove={onLastMove}
                    toggleOrientation={toggleOrientation}
                />
            </Stack>
            <Stack>
                <ChatBubble>Great job completing this puzzle!</ChatBubble>
                <Stack direction='row' justifyContent='space-between'>
                    <Button
                        variant='contained'
                        disableElevation
                        color='info'
                        sx={{ flexGrow: 1 }}
                        onClick={() => onRestart(board, chess)}
                    >
                        Restart
                    </Button>
                    <Coach src={coachUrl} />
                </Stack>
            </Stack>
        </>
    );
};

const HintSection: React.FC<HintSectionProps> = (props) => {
    let Component = null;

    switch (props.status) {
        case Status.WaitingForMove:
            Component = <WaitingForMoveHint {...props} />;
            break;
        case Status.IncorrectMove:
            Component = <IncorrectMoveHint {...props} />;
            break;
        case Status.CorrectMove:
            Component = <CorrectMoveHint {...props} />;
            break;
        case Status.Complete:
            Component = <CompleteHint {...props} />;
    }

    return <>{Component}</>;
};

export default HintSection;
