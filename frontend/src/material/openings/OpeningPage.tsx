import { useEffect, useMemo } from 'react';
import { Container, Divider, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { Opening } from '../../database/opening';
import LoadingPage from '../../loading/LoadingPage';
import Module from './Module';
import NotFoundPage from '../../NotFoundPage';

type OpeningPageParams = {
    id: string;
    levelName: string;
};

const OpeningPage = () => {
    const api = useApi();
    const params = useParams<OpeningPageParams>();
    const request = useRequest<Opening>();

    useEffect(() => {
        if (!request.isSent() && params.id) {
            request.onStart();
            api.getOpening(params.id)
                .then((resp) => {
                    request.onSuccess(resp.data);
                    console.log('getOpening: ', resp);
                })
                .catch((err) => {
                    request.onFailure(err);
                    console.error('getOpening: ', err);
                });
        }
    }, [request, api, params]);

    const openingLevel = useMemo(() => {
        return request.data?.levels.find(
            (l) => l.name.toLowerCase() === params.levelName?.toLowerCase()
        );
    }, [request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (request.data && openingLevel === undefined) {
        return <NotFoundPage />;
    }

    return (
        <Container maxWidth='xl' sx={{ pt: 6, pb: 4 }}>
            {openingLevel && (
                <Stack>
                    <Typography variant='h4'>{request.data!.name}</Typography>
                    <Typography variant='h5' color='text.secondary'>
                        {openingLevel.name} ({openingLevel.cohortRange})
                    </Typography>
                    <Divider />

                    <Stack spacing={6} mt={2}>
                        {openingLevel.modules.map((m) => (
                            <Module key={m.name} module={m} />
                        ))}
                    </Stack>
                </Stack>
            )}

            <RequestSnackbar request={request} />
        </Container>
    );
};

export default OpeningPage;
