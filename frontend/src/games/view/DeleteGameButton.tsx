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

export const MAX_GAMES_PER_DELETE_BATCH = 100;

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
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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

            <DeleteGamesDialog
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onSuccess={onSuccess}
                games={games}
            />
        </>
    );
};

export default DeleteGameButton;

export function DeleteGamesDialog({
    open,
    onClose,
    onSuccess,
    games,
}: {
    open: boolean;
    onClose: () => void;
    onSuccess?: (games: GameKey[]) => void;
    games: GameKey[];
}) {
    const api = useApi();
    const request = useRequest();
    const router = useRouter();

    const handleClose = () => {
        onClose();
        request.reset();
    };

    const onDelete = async () => {
        try {
            request.onStart();
            const deleted: GameKey[] = [];

            for (let i = 0; i < games.length; i += MAX_GAMES_PER_DELETE_BATCH) {
                const batch = games.slice(i, i + MAX_GAMES_PER_DELETE_BATCH);
                const resp = await api.deleteGames(batch);
                deleted.push(...resp.data);
            }

            for (const game of deleted) {
                trackEvent(EventType.DeleteGame, {
                    dojo_cohort: game.cohort,
                });
            }

            request.onSuccess();
            if (onSuccess) {
                onSuccess(deleted);
                handleClose();
            } else {
                router.push('/profile?view=games');
            }
        } catch (err) {
            console.error(err);
            request.onFailure(err);
        }
    };

    return (
        <Dialog open={open} onClose={request.isLoading() ? undefined : handleClose}>
            <DialogTitle>
                Delete{games.length !== 1 ? ` ${games.length}` : ''} Game
                {games.length !== 1 ? 's' : ''}?
            </DialogTitle>
            <DialogContent>
                Are you sure you want to delete{' '}
                {games.length === 1 ? 'this game' : 'these games'}? This action cannot be
                undone.
            </DialogContent>
            <DialogActions>
                <Button disabled={request.isLoading()} onClick={handleClose}>
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
    );
}
