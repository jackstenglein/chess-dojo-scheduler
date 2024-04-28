import { Move } from '@jackstenglein/chess';
import ThreeDRotationIcon from '@mui/icons-material/ThreeDRotation';
import {
    ChevronLeft,
    ChevronRight,
    FirstPage,
    LastPage,
    WifiProtectedSetup as Flip,
} from '@mui/icons-material';
import { IconButton, Stack, Tooltip } from '@mui/material';

import { useLocalStorage } from 'usehooks-ts';
import { useChess } from '../../PgnBoard';
import Board from '../../../Board';
import {
    GoToEndButtonBehavior,
    GoToEndButtonBehaviorKey,
} from '../underboard/settings/ViewerSettings';
import { useCallback } from 'react';

interface ControlButtonsProps {
    onClickMove: (move: Move | null) => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({ onClickMove}) => {
    const [goToEndBehavior] = useLocalStorage(
        GoToEndButtonBehaviorKey,
        GoToEndButtonBehavior.SingleClick,
    );
    const { chess, toggleOrientation } = useChess();

    const onFirstMove = () => {
        onClickMove(null);
    };

    const onPreviousMove = () => {
        if (chess) {
            onClickMove(chess.previousMove());
        }
    };

    const triggerThreeD = () => {
        // some way to trigger the Board.toggleThreeDMode
    }

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

    

    return (
        <Stack direction='row'>
            {goToEndBehavior !== GoToEndButtonBehavior.Hidden && (
                <Tooltip title='First Move'>
                    <IconButton
                        aria-label='first move'
                        onClick={
                            goToEndBehavior === GoToEndButtonBehavior.SingleClick
                                ? onFirstMove
                                : undefined
                        }
                        onDoubleClick={
                            goToEndBehavior === GoToEndButtonBehavior.DoubleClick
                                ? onFirstMove
                                : undefined
                        }
                    >
                        <FirstPage sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>
            )}

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

            {goToEndBehavior !== GoToEndButtonBehavior.Hidden && (
                <Tooltip title='Last Move'>
                    <IconButton
                        aria-label='last move'
                        onClick={
                            goToEndBehavior === GoToEndButtonBehavior.SingleClick
                                ? onLastMove
                                : undefined
                        }
                        onDoubleClick={
                            goToEndBehavior === GoToEndButtonBehavior.DoubleClick
                                ? onLastMove
                                : undefined
                        }
                    >
                        <LastPage sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>
            )}

            <Tooltip title='Flip Board'>
                <IconButton aria-label='flip board' onClick={toggleOrientation}>
                    <Flip sx={{ color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>

            <Tooltip title='3D Board'>
                <IconButton aria-label='view 3D board' onClick={toggleOrientation}>
                    <ThreeDRotationIcon sx={{ color: 'text.secondary' }} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};

export default ControlButtons;
