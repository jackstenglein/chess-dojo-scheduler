import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, IconButton, Stack, TextField, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { Game } from '../../database/game';
import CommentList from './CommentList';
import { useAuth } from '../../auth/Auth';
import PgnErrorBoundary from './PgnErrorBoundary';
import PgnBoard from '../../board/pgn/PgnBoard';
import LoadingPage from '../../loading/LoadingPage';

export const GameCommentTextFieldId = 'gameCommentTextField';

interface CommentEditorProps {
    cohort?: string;
    id?: string;
    onSuccess: (game: Game) => void;
}

const CommentEditor: React.FC<CommentEditorProps> = ({ cohort, id, onSuccess }) => {
    const [comment, setComment] = useState('');
    const commentRequest = useRequest();
    const api = useApi();

    const onSubmitComment = () => {
        const content = comment.trim();
        if (content.length === 0) {
            return;
        }

        commentRequest.onStart();
        api.createComment(cohort ?? '', id ?? '', content)
            .then((response) => {
                console.log(response);
                setComment('');
                commentRequest.onSuccess('Comment created');
                onSuccess(response.data);
            })
            .catch((err) => {
                console.error('Failed to create comment: ', err);
                commentRequest.onFailure(err);
            });
    };

    return (
        <Stack spacing={1} alignItems='flex-end'>
            <TextField
                id={GameCommentTextFieldId}
                label='Add a Comment'
                fullWidth
                multiline
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />
            <LoadingButton
                variant='contained'
                disabled={comment.trim().length === 0}
                loading={commentRequest.isLoading()}
                onClick={onSubmitComment}
            >
                Submit
            </LoadingButton>
            <RequestSnackbar request={commentRequest} showSuccess />
        </Stack>
    );
};

const GamePage = () => {
    const api = useApi();
    const user = useAuth().user!;
    const request = useRequest<Game>();
    const featureRequest = useRequest();
    const { cohort, id } = useParams();

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

    const onFeature = () => {
        if (!request.data) {
            return;
        }

        featureRequest.onStart();
        const game = request.data;
        api.featureGame(
            game.cohort,
            game.id,
            game.isFeatured === 'true' ? 'false' : 'true'
        )
            .then((response) => {
                featureRequest.onSuccess('Game featured');
                request.onSuccess(response.data);
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                featureRequest.onFailure(err);
            });
    };

    if (request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Box
            sx={{
                pt: 4,
                pb: 4,
                px: 0,
                '--gap': '16px',
                '--site-header-height': '80px',
                '--site-header-margin': '60px',
                '--player-header-height': '28px',
                '--underboard-width': '450px',
                '--coach-width': '400px',
                '--tools-height': '40px',
                '--board-width': {
                    xs: 'calc(100vw - var(--coach-width) - 60px)',
                    xl: 'calc(100vw - var(--coach-width) - var(--underboard-width) - 60px)',
                },
                '--board-height':
                    'calc(100vh - var(--site-header-height) - var(--site-header-margin) - var(--tools-height) - 8px - 2 * var(--player-header-height))',
                '--board-size': 'calc(min(var(--board-width), var(--board-height)))',
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    rowGap: '16px',
                    gridTemplateRows: {
                        xs: 'auto auto',
                    },
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'auto var(--board-size) var(--gap) var(--coach-width) auto',
                        xl: 'auto var(--underboard-width) var(--gap) var(--board-size) var(--gap) var(--coach-width) auto',
                    },
                    gridTemplateAreas: {
                        xs: '"pgn" "extras"',
                        md: '"pgn pgn pgn pgn pgn" ". extras . . ."',
                        xl: '"pgn pgn pgn pgn pgn pgn pgn" ". . . extras . . ."',
                    },
                }}
            >
                <RequestSnackbar request={request} />
                <RequestSnackbar request={featureRequest} showSuccess />

                {request.data?.pgn && (
                    <PgnErrorBoundary pgn={request.data.pgn} game={request.data}>
                        <PgnBoard
                            showTags
                            showEditor
                            game={request.data}
                            onSaveGame={request.onSuccess}
                            pgn={request.data.pgn}
                            startOrientation={request.data.orientation}
                        />

                        <Stack gridArea='extras' spacing={2}>
                            {user.isAdmin && (
                                <Stack
                                    direction='row'
                                    alignSelf='start'
                                    alignItems='center'
                                    spacing={2}
                                >
                                    <Typography>Feature Game?</Typography>
                                    <IconButton onClick={onFeature}>
                                        {request.data.isFeatured === 'true' ? (
                                            <CheckBoxIcon color='primary' />
                                        ) : (
                                            <CheckBoxOutlineBlankIcon />
                                        )}
                                    </IconButton>
                                </Stack>
                            )}

                            <Typography id='comments' variant='h6'>
                                Comments
                            </Typography>
                            <CommentEditor
                                cohort={cohort}
                                id={id}
                                onSuccess={request.onSuccess}
                            />
                            <CommentList comments={request.data.comments} />
                        </Stack>
                    </PgnErrorBoundary>
                )}
            </Box>
        </Box>
    );
};

export default GamePage;
