import React, {
    useCallback,
} from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
import {
    ChevronLeft,
    ChevronRight,
    FirstPage,
    LastPage,
} from '@mui/icons-material';
import { reconcile } from '../board/Board';
import { useChess } from '../board/pgn/PgnBoard';

export interface BookBoardControlsProps {
    onMovesChange?: (moves: string[]) => void;
}

const BookBoardControls: React.FC<BookBoardControlsProps> = ({onMovesChange}) => {
    const {chess, board} = useChess()
    const update = useCallback(() => {
        if (onMovesChange && chess) {
            const moves = chess.history()
                .slice(0, chess.currentMove()?.ply ?? 0)
                .map(m => m.san);
            onMovesChange(moves)
        }
        reconcile(chess, board)
    }, [chess, board, onMovesChange])

    const onFirstMove = useCallback(
        () => {
            chess?.seek(null);
            update()
        },
        [chess, update]
    );

    const onPreviousMove = useCallback(
        () => {
            chess?.seek(chess.previousMove());
            update()
        },
        [chess, update]
    );

    const onNextMove = useCallback(
        () => {
            const move = chess?.nextMove()
            if (move !== null) {
                chess?.seek(chess.nextMove());
                update()
            }
        },
        [chess, update]
    );

    const onLastMove = useCallback(
        () => {
            chess?.seek(chess.lastMove());
            update()
        },
        [chess, update]
    );

    return <Stack direction='row' alignItems="stretch">
        <Stack direction='row' alignItems="center" ml="-10px" flexGrow={1}>
            <Tooltip title='First Move'>
                <IconButton aria-label='first move' onClick={onFirstMove}>
                    <FirstPage sx={{ fontSize: 30, color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>

            <Tooltip title='Previous Move'>
                <IconButton aria-label='previous move' onClick={onPreviousMove}>
                    <ChevronLeft sx={{ fontSize: 30, color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>
        </Stack>

        <Stack direction='row' alignItems="center" mr="-10px" flexGrow={1} justifyContent="flex-end">
            <Tooltip title='Next Move'>
                <IconButton aria-label='next move' onClick={onNextMove}>
                    <ChevronRight sx={{ fontSize: 30, color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>

            <Tooltip title='Last Move'>
                <IconButton aria-label='last move' onClick={onLastMove}>
                    <LastPage sx={{ fontSize: 30, color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>
        </Stack>
    </Stack>
};

export default BookBoardControls
