import { Edit, ExpandMore } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Collapse,
    Divider,
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

interface BaseCommentProps {
    comment: PositionComment;
    renderContent?: JSX.Element;
    renderControls?: JSX.Element;
}

const BaseComment: React.FC<BaseCommentProps> = ({
    comment,
    renderContent,
    renderControls,
}) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <Stack spacing={0.5}>
            <Stack direction='row' spacing={0.5}>
                {!expanded && (
                    <Tooltip title='Expand Comment'>
                        <IconButton onClick={() => setExpanded(true)} size='small'>
                            <ExpandMore
                                fontSize='small'
                                sx={{ color: 'text.secondary' }}
                            />
                        </IconButton>
                    </Tooltip>
                )}
                <CommentInfo comment={comment} />
            </Stack>
            <Collapse in={expanded}>
                <Stack direction='row'>
                    <Tooltip title='Collapse Comment'>
                        <Stack
                            alignItems='center'
                            sx={{
                                width: '28px',
                                cursor: 'pointer',

                                ':hover .MuiDivider-root': {
                                    borderColor: 'primary.main',
                                },
                            }}
                            onClick={() => setExpanded(false)}
                        >
                            <Divider orientation='vertical' />
                        </Stack>
                    </Tooltip>
                    <Stack flexGrow={1} spacing={0.5}>
                        {renderContent ? (
                            renderContent
                        ) : (
                            <Typography
                                variant='body1'
                                style={{ whiteSpace: 'pre-line' }}
                            >
                                {comment.content}
                            </Typography>
                        )}

                        {renderControls ? (
                            renderControls
                        ) : (
                            <Stack direction='row'>
                                <Button
                                    size='small'
                                    sx={{ textTransform: 'none', minWidth: 0 }}
                                >
                                    reply
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </Stack>
            </Collapse>
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
        <>
            <BaseComment
                comment={comment}
                renderContent={
                    editValue === undefined ? undefined : (
                        <Stack width={1}>
                            <TextField
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                size='small'
                                sx={{ pt: 0.5 }}
                                multiline
                            />
                            <Stack direction='row'>
                                <Button
                                    size='small'
                                    sx={{ textTransform: 'none' }}
                                    onClick={() => setEditValue(undefined)}
                                    disabled={request.isLoading()}
                                >
                                    cancel
                                </Button>
                                <LoadingButton
                                    disabled={editValue.trim().length === 0}
                                    loading={request.isLoading()}
                                    size='small'
                                    sx={{ textTransform: 'none' }}
                                    onClick={onSave}
                                >
                                    save
                                </LoadingButton>
                            </Stack>
                        </Stack>
                    )
                }
                renderControls={
                    editValue === undefined ? (
                        <Stack direction='row' spacing={1}>
                            <Button
                                size='small'
                                sx={{ textTransform: 'none', minWidth: 0 }}
                            >
                                reply
                            </Button>
                            <Button
                                size='small'
                                sx={{ textTransform: 'none', minWidth: 0 }}
                                onClick={() => setEditValue(comment.content)}
                            >
                                edit
                            </Button>
                        </Stack>
                    ) : (
                        <></>
                    )
                }
            />

            {/* <Stack direction='row' justifyContent='space-between' alignItems='start'>
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
                
            ) : (
                <Stack direction='row'>
                    <Stack
                        alignItems='center'
                        sx={{
                            width: '28px',
                            cursor: 'pointer',

                            ':hover .MuiDivider-root': {
                                borderColor: 'primary.main',
                            },
                        }}
                    >
                        <Divider orientation='vertical' />
                    </Stack>
                    <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                        {comment.content}
                    </Typography>
                </Stack>
            )} */}

            <RequestSnackbar request={request} />
        </>
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
                size={28}
            />
            <Stack direction='row' spacing={1} alignItems='center'>
                <Link
                    component={RouterLink}
                    to={`/profile/${comment.owner.username}`}
                    sx={{ textDecoration: 'none' }}
                >
                    <Typography variant='subtitle1' sx={{ color: 'text.primary' }}>
                        {comment.owner.displayName} ({comment.owner.cohort})
                    </Typography>
                </Link>
                <GraduationIcon cohort={comment.owner.previousCohort} size={20} />
                <Typography variant='caption' color='text.secondary'>
                    • {createdAtDate} {createdAtTime}
                </Typography>
                {updatedAtDate && (
                    <Tooltip title={`Updated at ${updatedAtDate} • ${updatedAtTime}`}>
                        <Edit sx={{ color: 'text.secondary', fontSize: '0.8rem' }} />
                    </Tooltip>
                )}
            </Stack>
        </Stack>
    );
};
