import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useRequiredAuth } from '@/auth/Auth';
import { BlockBoardKeyboardShortcuts } from '@/board/pgn/PgnBoard';
import useGame from '@/context/useGame';
import { PositionComment } from '@/database/game';
import { LoadingButton } from '@mui/lab';
import { Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';

interface ReplyEditorProps {
    parent: PositionComment;
    onCancel: () => void;
}

const ReplyEditor: React.FC<ReplyEditorProps> = ({ parent, onCancel }) => {
    const [value, setValue] = useState('');
    const request = useRequest();
    const api = useApi();
    const { user } = useRequiredAuth();
    const { game, onUpdateGame } = useGame();

    if (!game || !onUpdateGame) {
        return null;
    }

    const onReply = () => {
        const content = value.trim();
        if (content.length === 0) {
            return;
        }

        const positionComment: PositionComment = {
            id: '',
            fen: parent.fen,
            ply: parent.ply,
            san: parent.san,
            owner: {
                username: user.username,
                displayName: user.displayName,
                cohort: user.dojoCohort,
                previousCohort: user.previousCohort,
            },
            createdAt: '',
            updatedAt: '',
            content,
            parentIds: `${parent.parentIds ? `${parent.parentIds},` : ''}${parent.id}`,
            replies: {},
        };

        request.onStart();
        api.createComment(game.cohort, game.id, positionComment, true)
            .then((resp) => {
                onUpdateGame(resp.data);
                onCancel();
            })
            .catch((err) => {
                console.error('createComment: ', err);
                request.onFailure(err);
            });
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter' || !e.shiftKey) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        onReply();
    };

    return (
        <Stack width={1} pt={1}>
            <TextField
                id={BlockBoardKeyboardShortcuts}
                size='small'
                placeholder={`Reply to ${parent.owner.displayName} (${parent.owner.cohort})`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={request.isLoading()}
                multiline
            />
            <Stack direction='row'>
                <Button
                    size='small'
                    sx={{ textTransform: 'none' }}
                    onClick={onCancel}
                    disabled={request.isLoading()}
                >
                    cancel
                </Button>
                <LoadingButton
                    disabled={value.trim().length === 0}
                    loading={request.isLoading()}
                    size='small'
                    sx={{ textTransform: 'none' }}
                    onClick={onReply}
                >
                    reply
                </LoadingButton>
            </Stack>

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default ReplyEditor;
