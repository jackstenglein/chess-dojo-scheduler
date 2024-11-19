'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { GetClubResponse } from '@/api/clubApi';
import { useAuth } from '@/auth/Auth';
import ScoreboardViewSelector from '@/components/scoreboard/ScoreboardViewSelector';
import LoadingPage from '@/loading/LoadingPage';
import Scoreboard from '@/scoreboard/Scoreboard';
import { Container, Link } from '@mui/material';
import { GridToolbarContainer } from '@mui/x-data-grid-pro';
import { useEffect } from 'react';

export function ClubScoreboardPage({ id }: { id: string }) {
    const api = useApi();
    const request = useRequest<GetClubResponse>();
    const { user } = useAuth();

    const reset = request.reset;
    useEffect(() => {
        if (id) {
            reset();
        }
    }, [id, reset]);

    useEffect(() => {
        if (user && id && !request.isSent()) {
            request.onStart();
            api.getClub(id, true)
                .then((resp) => {
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [id, request, api, user]);

    console.log('User: ', user);
    console.log('Id: ', id);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth={false} sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            <ScoreboardViewSelector value={`clubs/${id}`} />

            <Scoreboard
                user={user}
                rows={request.data?.scoreboard || []}
                loading={request.isLoading()}
                slots={{
                    toolbar: CustomToolbar,
                }}
                slotProps={{
                    toolbar: {
                        id,
                    },
                }}
            />
        </Container>
    );
}

function CustomToolbar({ id }: { id?: string }) {
    return (
        <GridToolbarContainer>
            <Link href={`/clubs/${id}`} sx={{ mt: 0.5, ml: 0.5 }}>
                Go to Club
            </Link>
        </GridToolbarContainer>
    );
}
