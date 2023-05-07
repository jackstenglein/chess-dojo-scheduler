import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { Game } from '../../database/game';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';

interface DeleteGameButtonProps {
    game: Game;
}

const DeleteGameButton: React.FC<DeleteGameButtonProps> = ({ game }) => {
    const api = useApi();
    const navigate = useNavigate();
    const request = useRequest();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const onDelete = () => {
        request.onStart();
        api.deleteGame(game.cohort, game.id)
            .then(() => {
                request.onSuccess();
                navigate('/profile?view=games');
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
            <Button
                variant='contained'
                color='error'
                onClick={() => setShowDeleteModal(true)}
            >
                Delete Game
            </Button>
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
