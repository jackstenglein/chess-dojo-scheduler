import { GameKey } from '@/database/game';
import { useRouter } from '@/hooks/useRouter';
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    IconButtonProps,
    Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';

interface DeleteGameButtonProps {
    games: GameKey[];
    variant?: 'icon' | 'contained' | 'outlined';
    slotProps?: {
        icon?: IconButtonProps;
    };
    onSuccess?: (games: GameKey[]) => void;
}

const DeleteGameButton: React.FC<DeleteGameButtonProps> = ({
    games,
    variant = 'icon',
    slotProps,
    onSuccess,
}) => {
    const api = useApi();
    const request = useRequest();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const router = useRouter();

    const onDelete = () => {
        request.onStart();
        api.deleteGames(games)
            .then((resp) => {
                for (const game of resp.data) {
                    trackEvent(EventType.DeleteGame, {
                        dojo_cohort: game.cohort,
                    });
                }
                request.onSuccess();
                if (onSuccess) {
                    onSuccess(resp.data);
                    setShowDeleteModal(false);
                } else {
                    router.push('/profile?view=games');
                }
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const onClose = () => {
        setShowDeleteModal(false);
        request.reset();
    };

    return (
        <>
            {variant === 'icon' ? (
                <Tooltip title={`Delete Game${games.length !== 1 ? 's' : ''}`}>
                    <IconButton
                        data-cy='delete-game-button'
                        onClick={() => setShowDeleteModal(true)}
                        {...slotProps?.icon}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Tooltip>
            ) : (
                <Button
                    data-cy='delete-game-button'
                    variant={variant}
                    onClick={() => setShowDeleteModal(true)}
                    color='error'
                >
                    Delete Game{games.length !== 1 ? 's' : ''}
                </Button>
            )}

            <Dialog
                open={showDeleteModal}
                onClose={request.isLoading() ? undefined : onClose}
            >
                <DialogTitle>
                    Delete{games.length !== 1 ? ` ${games.length}` : ''} Game
                    {games.length !== 1 ? 's' : ''}?
                </DialogTitle>
                <DialogContent>
                    Are you sure you want to delete{' '}
                    {games.length === 1 ? 'this game' : 'these games'}? This action cannot
                    be undone.
                </DialogContent>
                <DialogActions>
                    <Button disabled={request.isLoading()} onClick={onClose}>
                        Cancel
                    </Button>
                    <LoadingButton
                        data-cy='delete-game-confirm-button'
                        color='error'
                        loading={request.isLoading()}
                        onClick={onDelete}
                    >
                        Delete
                    </LoadingButton>
                </DialogActions>
                <RequestSnackbar request={request} />
            </Dialog>
        </>
    );
};

export default DeleteGameButton;
