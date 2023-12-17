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

import { useChess } from '../PgnBoard';
import { ClockTextFieldId, CommentTextFieldId } from '../Editor';
import { GameCommentTextFieldId } from '../../../games/view/GamePage';
import { TagTextFieldId } from '../Tags';

interface ControlButtonsProps {
    onClickMove: (move: Move | null) => void;
    small?: boolean;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({ onClickMove, small }) => {
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
        <Stack
            direction='row'
            width={small ? 1 : undefined}
            justifyContent={small ? 'space-around' : undefined}
        >
            <Tooltip title='First Move'>
                <IconButton
                    size={small ? 'small' : undefined}
                    aria-label='first move'
                    onClick={onFirstMove}
                    sx={small ? { flexGrow: 1 } : undefined}
                >
                    <FirstPage
                        fontSize={small ? 'small' : undefined}
                        sx={{ color: 'text.secondary' }}
                    />
                </IconButton>
            </Tooltip>

            <Tooltip title='Previous Move'>
                <IconButton
                    size={small ? 'small' : undefined}
                    aria-label='previous move'
                    onClick={onPreviousMove}
                    sx={small ? { flexGrow: 1 } : undefined}
                >
                    <ChevronLeft
                        fontSize={small ? 'small' : undefined}
                        sx={{ color: 'text.secondary' }}
                    />
                </IconButton>
            </Tooltip>

            <Tooltip title='Next Move'>
                <IconButton
                    size={small ? 'small' : undefined}
                    aria-label='next move'
                    onClick={onNextMove}
                    sx={small ? { flexGrow: 1 } : undefined}
                >
                    <ChevronRight
                        fontSize={small ? 'small' : undefined}
                        sx={{ color: 'text.secondary' }}
                    />
                </IconButton>
            </Tooltip>

            <Tooltip title='Last Move'>
                <IconButton
                    size={small ? 'small' : undefined}
                    aria-label='last move'
                    onClick={onLastMove}
                    sx={small ? { flexGrow: 1 } : undefined}
                >
                    <LastPage
                        fontSize={small ? 'small' : undefined}
                        sx={{ color: 'text.secondary' }}
                    />
                </IconButton>
            </Tooltip>

            <Tooltip title='Flip Board'>
                <IconButton
                    size={small ? 'small' : undefined}
                    aria-label='flip board'
                    onClick={toggleOrientation}
                    sx={small ? { flexGrow: 1 } : undefined}
                >
                    <Flip
                        fontSize={small ? 'small' : undefined}
                        sx={{ color: 'text.secondary' }}
                    />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default ControlButtons;
