import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Button,
    CircularProgress,
    Container,
    Grid,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Game } from '../database/game';
import PgnViewer from './PgnViewer';
import { LoadingButton } from '@mui/lab';
import CommentList from './CommentList';

const GamePage = () => {
    const api = useApi();
    const request = useRequest<Game>();
    const commentRequest = useRequest();
    const featureRequest = useRequest();
    const { cohort, id } = useParams();

    const [comment, setComment] = useState('');
    const [copied, setCopied] = useState('');

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

    const onCopy = (name: string) => {
        setCopied(name);
        setTimeout(() => {
            setCopied('');
        }, 3000);
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
        <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />
            <RequestSnackbar request={commentRequest} showSuccess />
            <RequestSnackbar request={featureRequest} showSuccess />

            {request.data?.pgn && <PgnViewer game={request.data} onFeature={onFeature} />}

            {request.data?.pgn && (
                <Grid container rowSpacing={4} justifyContent='flex-end'>
                    <Grid item xs={12} md={8} lg={9} mt={{ xs: 3, md: 1 }}>
                        <Stack spacing={2}>
                            <Stack direction='row' my={2} spacing={2}>
                                <CopyToClipboard
                                    text={window.location.href}
                                    onCopy={() => onCopy('link')}
                                >
                                    <Button
                                        variant='contained'
                                        startIcon={
                                            copied === 'link' ? (
                                                <CheckIcon />
                                            ) : (
                                                <LinkIcon />
                                            )
                                        }
                                    >
                                        {copied === 'link' ? 'Copied' : 'Copy Link'}
                                    </Button>
                                </CopyToClipboard>
                                <CopyToClipboard
                                    text={request.data.pgn}
                                    onCopy={() => onCopy('pgn')}
                                >
                                    <Button
                                        variant='contained'
                                        startIcon={
                                            copied === 'pgn' ? (
                                                <CheckIcon />
                                            ) : (
                                                <ContentPasteIcon />
                                            )
                                        }
                                    >
                                        {copied === 'pgn' ? 'Copied' : 'Copy PGN'}
                                    </Button>
                                </CopyToClipboard>
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
                    </Grid>
                </Grid>
            )}
        </Container>
    );
};

export default GamePage;
