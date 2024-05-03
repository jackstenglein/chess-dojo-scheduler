import { Chess, Move } from '@jackstenglein/chess';
import { Check, CheckCircle, Warning } from '@mui/icons-material';
import {
    Box,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    MenuList,
    Tooltip,
} from '@mui/material';
import React, { createContext, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import PgnBoard, { useChess } from '../../board/pgn/PgnBoard';
import { DefaultUnderboardTab } from '../../board/pgn/boardTools/underboard/Underboard';
import {
    ButtonProps as MoveButtonProps,
    MoveMenuProps,
} from '../../board/pgn/pgnText/MoveButton';
import { Game } from '../../database/game';
import PgnErrorBoundary from './PgnErrorBoundary';

type GameContextType = {
    game?: Game;
    onUpdateGame?: (g: Game) => void;
    isOwner?: boolean;
};

const GameContext = createContext<GameContextType>({});

export function useGame() {
    return useContext(GameContext);
}

const GamePage = () => {
    const api = useApi();
    const request = useRequest<Game>();
    const featureRequest = useRequest();
    const { cohort, id } = useParams();
    const user = useAuth().user;

    const reset = request.reset;
    useEffect(() => {
        if (cohort && id) {
            reset();
        }
    }, [cohort, id, reset]);

    useEffect(() => {
        if (!request.isSent() && cohort && id) {
            request.onStart();
            api.getGame(cohort, id)
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error('Failed to get game: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api, cohort, id]);

    const isOwner = request.data?.owner === user?.username;

    return (
        <Box
            sx={{
                pt: 4,
                pb: 4,
                px: 0,
            }}
        >
            <RequestSnackbar request={request} />
            <RequestSnackbar request={featureRequest} showSuccess />

            <PgnErrorBoundary pgn={request.data?.pgn} game={request.data}>
                <GameContext.Provider
                    value={{
                        game: request.data,
                        onUpdateGame: request.onSuccess,
                        isOwner,
                    }}
                >
                    <PgnBoard
                        pgn={request.data?.pgn}
                        startOrientation={request.data?.orientation}
                        underboardTabs={[
                            DefaultUnderboardTab.Tags,
                            ...(isOwner ? [DefaultUnderboardTab.Editor] : []),
                            DefaultUnderboardTab.Comments,
                            DefaultUnderboardTab.Explorer,
                            DefaultUnderboardTab.Clocks,
                            DefaultUnderboardTab.Settings,
                        ]}
                        allowMoveDeletion={request.data?.owner === user?.username}
                        slots={{
                            moveButton: {
                                extras: GameMoveButtonExtras,
                                allowContextMenu: (chess, move) =>
                                    isSuggestedVariation(user?.username, chess, move),
                                contextMenu: SuggestedVariationMenu,
                            },
                        }}
                    />
                </GameContext.Provider>
            </PgnErrorBoundary>
        </Box>
    );
};

export default GamePage;

const GameMoveButtonExtras: React.FC<MoveButtonProps> = ({ move }) => {
    const username = useAuth().user?.username;
    const { chess } = useChess();

    if (!isSuggestedVariation(username, chess, move)) {
        return null;
    }

    if (move.userData?.saved) {
        return (
            <Tooltip title='Your suggestion of this move is saved. If you want to unsave it, right click.'>
                <CheckCircle fontSize='small' sx={{ ml: 0.5 }} color='success' />
            </Tooltip>
        );
    }

    return (
        <Tooltip title='Your suggestion of this move is unsaved. If you want to save it as a comment, right click.'>
            <Warning fontSize='small' sx={{ ml: 0.5 }} color='error' />
        </Tooltip>
    );
};

function isSuggestedVariation(
    username: string | undefined,
    chess: Chess | undefined,
    move: Move,
): boolean {
    if (!chess) {
        return false;
    }

    if (!username || username !== move.userData?.username) {
        return false;
    }

    if (move.variation[0] !== move || !chess.isInMainline(move.previous)) {
        // Only display the warning on the first move of the variation
        return false;
    }

    return true;
}

const SuggestedVariationMenu: React.FC<MoveMenuProps> = ({ anchor, move, onClose }) => {
    const isSaved = Boolean(move.userData?.saved);

    const toggleSave = () => {
        move.userData = {
            ...move.userData,
            saved: !isSaved,
        };
        onClose();
    };

    return (
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={onClose}>
            <MenuList>
                <MenuItem onClick={toggleSave}>
                    <ListItemIcon>
                        <Check />
                    </ListItemIcon>
                    <ListItemText>{isSaved ? 'Unsave' : 'Save'} Suggestion</ListItemText>
                </MenuItem>
            </MenuList>
        </Menu>
    );
};
