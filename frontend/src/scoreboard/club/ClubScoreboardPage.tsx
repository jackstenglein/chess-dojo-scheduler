import { Container, Link } from '@mui/material';
import { GridToolbarContainer } from '@mui/x-data-grid-pro';
import { useEffect } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useApi } from '../../api/Api';
import { GetClubResponse } from '../../api/clubApi';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import LoadingPage from '../../loading/LoadingPage';
import Scoreboard from '../Scoreboard';
import ScoreboardViewSelector from '../ScoreboardViewSelector';

export type ClubScoreboardPageParams = {
    id: string;
};

const ClubScoreboardPage = () => {
    const { id } = useParams<ClubScoreboardPageParams>();
    const api = useApi();
    const request = useRequest<GetClubResponse>();
    const user = useAuth().user;

    const reset = request.reset;
    useEffect(() => {
        if (id) {
            reset();
        }
    }, [id, reset]);

    useEffect(() => {
        if (id && !request.isSent()) {
            request.onStart();
            api.getClub(id, true)
                .then((resp) => {
                    console.log('getClub: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [id, request, api]);

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
};

function CustomToolbar({ id }: { id: string }) {
    return (
        <GridToolbarContainer>
            <Link component={RouterLink} to={`/clubs/${id}`} sx={{ mt: 0.5, ml: 0.5 }}>
                Go to Club
            </Link>
        </GridToolbarContainer>
    );
}

export default ClubScoreboardPage;
