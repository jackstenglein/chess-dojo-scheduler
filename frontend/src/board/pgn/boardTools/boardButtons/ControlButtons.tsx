import { Move } from '@jackstenglein/chess';
import {
    ChevronLeft,
    ChevronRight,
    FirstPage,
    WifiProtectedSetup as Flip,
    LastPage,
} from '@mui/icons-material';
import { IconButton, Stack, Tooltip } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';
import { useReconcile } from '../../../Board';
import { useChess } from '../../PgnBoard';
import {
    GoToEndButtonBehavior,
    GoToEndButtonBehaviorKey,
} from '../underboard/settings/ViewerSettings';

const ControlButtons = () => {
    const [goToEndBehavior] = useLocalStorage(
        GoToEndButtonBehaviorKey,
        GoToEndButtonBehavior.SingleClick,
    );
    const { chess, toggleOrientation } = useChess();
    const reconcile = useReconcile();

    const onClickMove = (move: Move | null) => {
        chess?.seek(move);
        reconcile();
    };

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

    return (
        <Stack direction='row' gap={{ xs: 1.5, sm: 0 }} flexWrap='wrap'>
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

            {toggleOrientation && (
                <Tooltip title='Flip Board'>
                    <IconButton aria-label='flip board' onClick={toggleOrientation}>
                        <Flip sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
    );
};

export default ControlButtons;
