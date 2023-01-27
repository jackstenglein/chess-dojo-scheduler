import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CircularProgress, Container, Stack } from '@mui/material';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Game } from '../database/game';
import PgnViewer from './PgnViewer';

const GamePage = () => {
    const api = useApi();
    const request = useRequest<Game>();
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

    return (
        <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            {request.isLoading() && (
                <Stack justifyContent='center' alignItems='center'>
                    <CircularProgress />
                </Stack>
            )}

            {request.data?.pgn && <PgnViewer game={request.data} />}
        </Container>
    );
};

export default GamePage;
