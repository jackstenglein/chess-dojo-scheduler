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
    Tooltip,
} from '@mui/material';
import { useState } from 'react';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { Game } from '../../database/game';

interface DeleteGameButtonProps {
    game: Game;
    variant?: 'icon' | 'contained' | 'outlined';
}

const DeleteGameButton: React.FC<DeleteGameButtonProps> = ({
    game,
    variant = 'icon',
}) => {
    const api = useApi();
    const request = useRequest();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const router = useRouter();

    const onDelete = () => {
        request.onStart();
        api.deleteGame(game.cohort, game.id)
            .then(() => {
                trackEvent(EventType.DeleteGame, {
                    dojo_cohort: game.cohort,
                });
                request.onSuccess();
                router.push('/profile?view=games');
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
                <Tooltip title='Delete Game'>
                    <IconButton
                        data-cy='delete-game-button'
                        onClick={() => setShowDeleteModal(true)}
                    >
                        <DeleteIcon sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>
            ) : (
                <Button
                    data-cy='delete-game-button'
                    variant={variant}
                    onClick={() => setShowDeleteModal(true)}
                    color='error'
                >
                    Delete Game
                </Button>
            )}

            <Dialog
                open={showDeleteModal}
                onClose={request.isLoading() ? undefined : onClose}
            >
                <DialogTitle>Delete Game?</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this game? This action cannot be
                    undone.
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
