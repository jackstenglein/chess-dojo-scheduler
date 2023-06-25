import React, { useCallback, useEffect } from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { Move } from '@jackstenglein/chess';

import { BoardApi, toColor, Chess } from '../Board';
import ChatBubble from './ChatBubble';
import { Status } from './PuzzleBoard';
import Coach from './Coach';

interface HintSectionProps {
    status: Status;
    move: Move | null;
    board: BoardApi;
    chess: Chess;
    onRestart: (board: BoardApi, chess: Chess) => void;
    onNext: (board: BoardApi, chess: Chess) => void;
    onRetry: (board: BoardApi, chess: Chess) => void;
}

const WaitingForMoveHint: React.FC<HintSectionProps> = ({ move, chess }) => {
    return (
        <>
            <ChatBubble>
                {move?.commentAfter ||
                    (!move && chess.pgn.gameComment) ||
                    'What would you play in this position?'}
            </ChatBubble>

            <Stack direction='row' alignItems='center' justifyContent='space-between'>
                <Stack>
                    <Typography variant='h6' fontWeight='bold' color='text.secondary'>
                        Your turn
                    </Typography>
                    <Typography color='text.secondary'>
                        Find the best move for {toColor(chess)}.
                    </Typography>
                </Stack>

                <Coach src='/jesse.png' />
            </Stack>
        </>
    );
};

const IncorrectMoveHint: React.FC<HintSectionProps> = ({
    move,
    board,
    chess,
    onRetry,
}) => {
    const upHandler = useCallback(
        (event: KeyboardEvent) => {
            console.log('Key up: ', event.key);
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
                <Coach src='/jesse.png' />
            </Stack>
        </>
    );
};

const CorrectMoveHint: React.FC<HintSectionProps> = ({ move, board, chess, onNext }) => {
    const upHandler = useCallback(
        (event: KeyboardEvent) => {
            console.log('Key up: ', event.key);
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
                <Coach src='/jesse.png' />
            </Stack>
        </>
    );
};

function getResultDisplay(result: string): string {
    if (result === '1-0') {
        return 'White wins.';
    }
    if (result === '0-1') {
        return 'Black wins.';
    }
    if (result === '1/2-1/2') {
        return 'Draw';
    }
    return '';
}

const CompleteHint: React.FC<HintSectionProps> = ({ board, chess, onRestart }) => {
    const result = chess.pgn.header.tags.Result;
    const gameOver = chess.currentMove() === chess.lastMove();

    let comment = chess.currentMove()?.commentAfter;
    if (!comment && gameOver) {
        comment = `${result} ${getResultDisplay(result)}`;
    }

    return (
        <>
            <ChatBubble>
                {comment}
                {comment && (
                    <>
                        <br />
                        <br />
                    </>
                )}
                Great job completing this puzzle!
            </ChatBubble>
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
                <Coach src='/jesse.png' />
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

    return <Stack ml={2}>{Component}</Stack>;
};

export default HintSection;
