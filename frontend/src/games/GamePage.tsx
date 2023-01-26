import { CircularProgress, Container } from '@mui/material';
import { useEffect } from 'react';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Game } from '../database/game';

import PgnViewer from './PgnViewer';

const GamePage = () => {
    const api = useApi();
    const request = useRequest<Game>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getGame('1800-1900', '2019.04.20_739a12ef-ec47-43e5-9d6e-fc3f0bd21f3a')
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error('Failed to get game: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    return (
        <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            {request.isLoading() && <CircularProgress />}

            {request.data?.pgn && <PgnViewer pgn={request.data.pgn} />}
        </Container>
    );
};

export default GamePage;
