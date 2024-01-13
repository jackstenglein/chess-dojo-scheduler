import { Move } from '@jackstenglein/chess';
import {
    ChevronLeft,
    ChevronRight,
    FirstPage,
    WifiProtectedSetup as Flip,
    LastPage,
} from '@mui/icons-material';
import { Stack, Tooltip, IconButton } from '@mui/material';
import { useCallback, useEffect } from 'react';

import { useChess } from '../../PgnBoard';
import { ClockTextFieldId, CommentTextFieldId } from '../Editor';
import { GameCommentTextFieldId } from '../../../../games/view/GamePage';
import { TagTextFieldId } from '../Tags';

interface ControlButtonsProps {
    onClickMove: (move: Move | null) => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({ onClickMove }) => {
    const { chess, board } = useChess();

    const onFirstMove = () => {
        onClickMove(null);
    };

    const onPreviousMove = () => {
        if (chess) {
            onClickMove(chess.previousMove());
        }
    };

    const onNextMove = () => {
        if (chess) {
            const nextMove = chess.nextMove();
            if (nextMove) {
                onClickMove(nextMove);
            }
        }
    };

    const onLastMove = () => {
        if (chess) {
            onClickMove(chess.lastMove());
        }
    };

    const toggleOrientation = useCallback(() => {
        if (board) {
            board.toggleOrientation();
        }
    }, [board]);

    useEffect(() => {
        const onArrowKeys = (event: KeyboardEvent) => {
            if (
                event.key === 'f' &&
                document.activeElement?.id !== ClockTextFieldId &&
                document.activeElement?.id !== CommentTextFieldId &&
                document.activeElement?.id !== GameCommentTextFieldId &&
                document.activeElement?.id !== TagTextFieldId
            ) {
                toggleOrientation();
            }
        };
        window.addEventListener('keyup', onArrowKeys);
        return () => {
            window.removeEventListener('keyup', onArrowKeys);
        };
    }, [toggleOrientation]);

    return (
        <Stack direction='row'>
            <Tooltip title='First Move'>
                <IconButton aria-label='first move' onClick={onFirstMove}>
                    <FirstPage sx={{ color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>

            <Tooltip title='Previous Move'>
                <IconButton aria-label='previous move' onClick={onPreviousMove}>
                    <ChevronLeft sx={{ color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>

            <Tooltip title='Next Move'>
                <IconButton aria-label='next move' onClick={onNextMove}>
                    <ChevronRight sx={{ color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>

            <Tooltip title='Last Move'>
                <IconButton aria-label='last move' onClick={onLastMove}>
                    <LastPage sx={{ color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>

            <Tooltip title='Flip Board'>
                <IconButton aria-label='flip board' onClick={toggleOrientation}>
                    <Flip sx={{ color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default ControlButtons;
