import { Edit } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    IconButton,
    Link,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useApi } from '../../../../../api/Api';
import { UpdateCommentRequest } from '../../../../../api/gameApi';
import { RequestSnackbar, useRequest } from '../../../../../api/Request';
import { useAuth } from '../../../../../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../../../../../calendar/displayDate';
import { PositionComment } from '../../../../../database/game';
import { useGame } from '../../../../../games/view/GamePage';
import Avatar from '../../../../../profile/Avatar';
import GraduationIcon from '../../../../../scoreboard/GraduationIcon';

interface CommentProps {
    comment: PositionComment;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
    const viewer = useAuth().user;

    if (viewer?.username === comment.owner.username) {
        return <EditableComment comment={comment} />;
    }

    return <BaseComment comment={comment} />;
};

export default Comment;

const BaseComment: React.FC<CommentProps> = ({ comment }) => {
    return (
        <Stack spacing={0.5}>
            <CommentInfo comment={comment} />
            <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                {comment.content}
            </Typography>
        </Stack>
    );
};

const EditableComment: React.FC<CommentProps> = ({ comment }) => {
    const [editValue, setEditValue] = useState<string>();
    const api = useApi();
    const request = useRequest();
    const { game, onUpdateGame } = useGame();

    const onSave = () => {
        if (editValue === comment.content) {
            setEditValue(undefined);
            return;
        }

        const update: UpdateCommentRequest = {
            cohort: game?.cohort || '',
            gameId: game?.id || '',
            id: comment.id,
            fen: comment.fen,
            content: editValue?.trim() || '',
        };
        request.onStart();
        api.updateComment(update)
            .then((resp) => {
                console.log('updateComment: ', resp);
                onUpdateGame?.(resp.data);
                setEditValue(undefined);
                request.onSuccess();
            })
            .catch((err) => {
                console.error('updateComment: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Stack spacing={0.5}>
            <Stack direction='row' justifyContent='space-between' alignItems='start'>
                <CommentInfo comment={comment} />
                {editValue === undefined && (
                    <Tooltip title='Edit Comment'>
                        <IconButton
                            size='small'
                            onClick={() => setEditValue(comment.content)}
                        >
                            <Edit sx={{ color: 'text.secondary' }} fontSize='inherit' />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            {editValue !== undefined ? (
                <Stack>
                    <TextField
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        size='small'
                        sx={{ pt: 0.5 }}
                    />
                    <Stack direction='row'>
                        <Button
                            size='small'
                            sx={{ textTransform: 'none' }}
                            onClick={() => setEditValue(undefined)}
                            disabled={request.isLoading()}
                        >
                            Cancel
                        </Button>
                        <LoadingButton
                            disabled={editValue.trim().length === 0}
                            loading={request.isLoading()}
                            size='small'
                            sx={{ textTransform: 'none' }}
                            onClick={onSave}
                        >
                            Save
                        </LoadingButton>
                    </Stack>
                </Stack>
            ) : (
                <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                    {comment.content}
                </Typography>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

const CommentInfo: React.FC<CommentProps> = ({ comment }) => {
    const viewer = useAuth().user;

    const createdAt = new Date(comment.createdAt);

    const createdAtDate = toDojoDateString(createdAt, viewer?.timezoneOverride);
    const createdAtTime = toDojoTimeString(
        createdAt,
        viewer?.timezoneOverride,
        viewer?.timeFormat,
    );

    let updatedAtDate = '';
    let updatedAtTime = '';

    if (comment.createdAt !== comment.updatedAt) {
        const updatedAt = new Date(comment.updatedAt);
        updatedAtDate = toDojoDateString(updatedAt, viewer?.timezoneOverride);
        updatedAtTime = toDojoTimeString(
            updatedAt,
            viewer?.timezoneOverride,
            viewer?.timeFormat,
        );
    }

    return (
        <Stack direction='row' spacing={1.5}>
            <Avatar
                username={comment.owner.username}
                displayName={comment.owner.displayName}
                size={48}
            />
            <Stack>
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Link
                        component={RouterLink}
                        to={`/profile/${comment.owner.username}`}
                        sx={{ textDecoration: 'none' }}
                    >
                        <Typography variant='subtitle1' color='text.secondary'>
                            {comment.owner.displayName} ({comment.owner.cohort})
                        </Typography>
                    </Link>
                    <GraduationIcon cohort={comment.owner.previousCohort} size={20} />
                </Stack>
                <Stack direction='row' spacing={1} alignItems='baseline'>
                    <Typography variant='subtitle2' color='text.secondary'>
                        {createdAtDate} • {createdAtTime}
                    </Typography>
                    {updatedAtDate && (
                        <Tooltip title={`Updated at ${updatedAtDate} • ${updatedAtTime}`}>
                            <Edit sx={{ color: 'text.secondary', fontSize: '0.8rem' }} />
                        </Tooltip>
                    )}
                </Stack>
            </Stack>
        </Stack>
    );
};
