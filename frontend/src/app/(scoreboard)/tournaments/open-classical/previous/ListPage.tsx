'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { OpenClassical } from '@/database/tournament';
import LoadingPage from '@/loading/LoadingPage';
import { Container, Link, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';

const ListPage = () => {
    const api = useApi();
    const request = useRequest<OpenClassical[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listPreviousOpenClassicals()
                .then((openClassicals) => {
                    console.log('listPreviousOpenClassicals: ', openClassicals);
                    request.onSuccess(openClassicals);
                })
                .catch((err) => {
                    console.error('listPreviousOpenClassicals', err);
                    request.onFailure(err);
                });
        }
    });

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container sx={{ py: 5 }}>
            <RequestSnackbar request={request} />
            <Typography variant='h4'>Completed Open Classicals</Typography>

            <Stack mt={4}>
                {request.data?.map((openClassical) => (
                    <Link
                        key={openClassical.startsAt}
                        href={`/tournaments/open-classical?tournament=${openClassical.startsAt}`}
                    >
                        {openClassical.name}
                    </Link>
                ))}
            </Stack>
        </Container>
    );
};

export default ListPage;
