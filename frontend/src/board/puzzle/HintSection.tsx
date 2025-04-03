import { Move } from '@jackstenglein/chess';
import { Button, Stack, Typography } from '@mui/material';
import React, { useCallback, useEffect, useRef } from 'react';

import { BoardApi, Chess, reconcile, toColor } from '../Board';
import BoardButtons from '../pgn/boardTools/boardButtons/BoardButtons';
import PgnText from '../pgn/pgnText/PgnText';
import ChatBubble from './ChatBubble';
import Coach from './Coach';
import { Status } from './PuzzleBoard';

interface HintSectionProps {
    status: Status;
    move: Move | null;
    board?: BoardApi;
    chess: Chess;
    coachUrl?: string;
    playBothSides?: boolean;
    onRestart: (board: BoardApi | undefined, chess: Chess) => void;
    onNext: (board: BoardApi | undefined, chess: Chess) => void;
    onRetry: (board: BoardApi | undefined, chess: Chess) => void;
    onNextPuzzle?: () => void;
}

const TurnPrompt = ({ chess, playBothSides }: { chess: Chess; playBothSides: boolean }) => {
    return (
        <Stack>
            <Typography variant='h6' fontWeight='bold' color='text.secondary'>
                Your turn
            </Typography>
            <Typography color='text.secondary'>
                {playBothSides ? 'Recall the move for ' : 'Find the best move for '}
                {toColor(chess)}.
            </Typography>
        </Stack>
    );
};

const WaitingForMoveHint: React.FC<HintSectionProps> = ({
    move,
    chess,
    coachUrl,
    playBothSides = false,
}) => {
    let comment = move ? move.commentAfter : chess.pgn.gameComment.comment;
    if (!comment || comment.includes('[#]')) {
        comment = playBothSides
            ? `What did ${toColor(chess)} play in this position?`
            : 'What would you play in this position?';
    }

    return (
        <>
            <ChatBubble>{comment}</ChatBubble>

            <Stack direction='row' alignItems='center' justifyContent='space-between'>
                <TurnPrompt chess={chess} playBothSides={playBothSides} />
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
        [onRetry, board, chess],
    );

    useEffect(() => {
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keyup', upHandler);
        };
    }, [upHandler]);

    return (
        <>
            <ChatBubble>{move?.commentAfter || 'Incorrect, please try again.'}</ChatBubble>
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
    playBothSides,
    onNext,
}) => {
    const upHandler = useCallback(
        (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !playBothSides) {
                event.stopPropagation();
                onNext(board, chess);
            }
        },
        [onNext, board, chess, playBothSides],
    );

    useEffect(() => {
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keyup', upHandler);
        };
    }, [upHandler]);

    let chatText = move?.commentAfter || 'Good move!';

    if (playBothSides) {
        chatText = `What did ${toColor(chess)} play in this position?`;
    }

    return (
        <>
            <ChatBubble>{chatText}</ChatBubble>
            <Stack direction='row' alignItems='center' justifyContent='space-between'>
                {playBothSides ? (
                    <TurnPrompt chess={chess} playBothSides={true} />
                ) : (
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
                )}
                <Coach src={coachUrl} />
            </Stack>
        </>
    );
};

const CompleteHint: React.FC<HintSectionProps> = ({
    board,
    chess,
    coachUrl,
    playBothSides,
    onRestart,
    onNextPuzzle,
}) => {
    const keydownMap = useRef({ shift: false });

    const onMove = useCallback(
        (move: Move | null) => {
            chess.seek(move);
            reconcile(chess, board);
        },
        [board, chess],
    );

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.key === 'Shift') {
                keydownMap.current.shift = true;
            } else if (event.key === 'ArrowRight') {
                let nextMove = chess.nextMove();
                if (keydownMap.current.shift && nextMove?.variations.length) {
                    nextMove = nextMove.variations[0][0];
                }
                if (nextMove) {
                    onMove(nextMove);
                }
            } else if (event.key === 'ArrowLeft') {
                const prevMove = chess.previousMove();
                onMove(prevMove);
            }
        },
        [chess, onMove],
    );

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Shift') {
            keydownMap.current.shift = false;
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [onKeyDown, onKeyUp]);

    const chatText = playBothSides
        ? 'Great job memorizing this game!'
        : 'Great job completing this puzzle';

    return (
        <>
            <Stack flexGrow={1} spacing={1} sx={{ overflowY: 'hidden' }}>
                <PgnText />
                <BoardButtons />
            </Stack>
            <Stack>
                <ChatBubble>{chatText}</ChatBubble>
                <Stack direction='row' justifyContent='space-between'>
                    <Stack flexGrow={1} spacing={0.5}>
                        <Button
                            variant='contained'
                            disableElevation
                            sx={{ flexGrow: 1 }}
                            onClick={() => onRestart(board, chess)}
                        >
                            Restart
                        </Button>
                        {onNextPuzzle && (
                            <Button
                                variant='contained'
                                disableElevation
                                color='info'
                                sx={{ flexGrow: 1 }}
                                onClick={onNextPuzzle}
                            >
                                Next Puzzle
                            </Button>
                        )}
                    </Stack>
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
