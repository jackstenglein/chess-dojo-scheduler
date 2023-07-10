import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { Game } from '../../database/game';
import CommentList from './CommentList';
import { useAuth } from '../../auth/Auth';
import DeleteGameButton from './DeleteGameButton';
import PgnErrorBoundary from './PgnErrorBoundary';
import PgnBoard from '../../board/pgn/PgnBoard';

const GamePage = () => {
    const api = useApi();
    const user = useAuth().user!;
    const navigate = useNavigate();
    const request = useRequest<Game>();
    const commentRequest = useRequest();
    const featureRequest = useRequest();
    const { cohort, id } = useParams();

    const [comment, setComment] = useState('');

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

    const onSubmitComment = () => {
        const content = comment.trim();
        if (content.length === 0) {
            return;
        }

        commentRequest.onStart();
        api.createComment(cohort ?? '', id ?? '', content)
            .then((response) => {
                console.log(response);
                commentRequest.onSuccess('Comment created');
                request.onSuccess(response.data);
                setComment('');
            })
            .catch((err) => {
                console.error('Failed to create comment: ', err);
                commentRequest.onFailure(err);
            });
    };

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
        return (
            <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
                {request.isLoading() && (
                    <Stack justifyContent='center' alignItems='center'>
                        <CircularProgress />
                    </Stack>
                )}
            </Container>
        );
    }

    return (
        <Container
            maxWidth={false}
            sx={{
                pt: 4,
                pb: 4,
                '--gap': '16px',
                '--site-header-height': '80px',
                '--site-header-margin': '60px',
                '--player-header-height': '28px',
                '--coach-width': '400px',
                '--tools-height': '40px',
                '--board-width': 'calc(100vw - var(--coach-width) - 60px)',
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
                    },
                    gridTemplateAreas: {
                        xs: '"pgn" "extras"',
                        md: '"pgn pgn pgn pgn pgn" ". extras . . ."',
                    },
                }}
            >
                <RequestSnackbar request={request} />
                <RequestSnackbar request={commentRequest} showSuccess />
                <RequestSnackbar request={featureRequest} showSuccess />

                {request.data?.pgn && (
                    <PgnErrorBoundary pgn={request.data.pgn}>
                        <PgnBoard
                            pgn={request.data.pgn}
                            startOrientation={request.data.orientation}
                        />
                    </PgnErrorBoundary>
                )}

                {request.data?.pgn && (
                    <Stack gridArea='extras' spacing={2}>
                        <Stack direction='row' my={2} spacing={2} flexWrap='wrap'>
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

                            {request.data.owner === user.username && (
                                <Stack
                                    direction='row'
                                    alignSelf='start'
                                    alignItems='center'
                                    spacing={2}
                                    sx={{ mb: 2 }}
                                >
                                    <Button
                                        variant='contained'
                                        onClick={() => navigate('edit')}
                                    >
                                        Update PGN
                                    </Button>
                                    <DeleteGameButton game={request.data} />
                                </Stack>
                            )}
                        </Stack>

                        <Typography variant='h6'>Comments</Typography>
                        <Stack spacing={1} alignItems='flex-end'>
                            <TextField
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
                        </Stack>

                        <CommentList comments={request.data.comments} />
                    </Stack>
                )}
            </Box>
        </Container>
    );
};

export default GamePage;
