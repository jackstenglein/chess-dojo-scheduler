import { Send } from '@mui/icons-material';
import { CircularProgress, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import { useState } from 'react';
import { useApi } from '../../../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../../../api/Request';
import { useAuth } from '../../../../../auth/Auth';
import { PositionComment } from '../../../../../database/game';
import { useGame } from '../../../../../games/view/GamePage';
import { BlockBoardKeyboardShortcuts, useChess } from '../../../PgnBoard';

const CommentEditor = () => {
    const user = useAuth().user!;
    const api = useApi();
    const [comment, setComment] = useState('');
    const request = useRequest();
    const { chess } = useChess();
    const { game, onUpdateGame } = useGame();

    if (!game || !onUpdateGame) {
        return null;
    }

    const onSubmit = () => {
        const content = comment.trim();
        if (content.length === 0) {
            return;
        }

        const positionComment: PositionComment = {
            id: '',
            fen: chess?.normalizedFen() || '',
            ply: chess?.currentMove()?.ply || 0,
            san: chess?.currentMove()?.san,
            owner: {
                username: user.username,
                displayName: user.displayName,
                cohort: user.dojoCohort,
                previousCohort: user.previousCohort,
            },
            createdAt: '',
            updatedAt: '',
            content,
        };
        const existingComments = Boolean(game.positionComments?.[positionComment.fen]);

        request.onStart();
        api.createComment(game.cohort, game.id, positionComment, existingComments)
            .then((resp) => {
                console.log('createComment: ', resp);
                setComment('');
                request.onSuccess();
                onUpdateGame(resp.data);
            })
            .catch((err) => {
                console.error('createComment: ', err);
                request.onFailure(err);
            });
    };

    const move = chess?.currentMove();

    return (
        <Stack spacing={1} direction='row' alignItems='end' px={2}>
            <TextField
                id={BlockBoardKeyboardShortcuts}
                placeholder={`Comment on ${
                    move
                        ? `${move.ply % 2 ? `${Math.floor(move.ply / 2) + 1}.` : `${move.ply / 2}...`} ${move.san}`
                        : 'Starting Position'
                }`}
                fullWidth
                multiline
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={request.isLoading()}
                maxRows={8}
            />
            {request.isLoading() ? (
                <CircularProgress size={40} />
            ) : (
                <Tooltip title='Post Comment'>
                    <div>
                        <IconButton
                            disabled={comment.trim().length === 0}
                            color='primary'
                            onClick={onSubmit}
                        >
                            <Send />
                        </IconButton>
                    </div>
                </Tooltip>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default CommentEditor;
