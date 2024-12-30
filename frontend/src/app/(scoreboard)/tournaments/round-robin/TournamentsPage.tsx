import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { Tournament } from '@/components/tournaments/round-robin/Tournament';
import { dojoCohorts } from '@/database/user';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Container, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { ChangeEvent, useEffect } from 'react';
import { fetchTournamentData, TournamentId } from './roundRobinApi';

/** Renders the Round Robin tournaments page. */
export function TournamentsPage() {
    const { user } = useAuth();
    const { searchParams, updateSearchParams } = useNextSearchParams({
        cohort: user?.dojoCohort || '0-300',
    });
    const request = useRequest<TournamentId>();

    const cohort = searchParams.get('cohort') || '0-300';
    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();

            fetchTournamentData(parseInt(cohort))
                .then(request.onSuccess)
                .catch((err) => {
                    console.error('fetchTournamentData: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, cohort]);

    const onChangeCohort = (e: ChangeEvent<HTMLInputElement>) => {
        updateSearchParams({ cohort: e.target.value });
        request.reset();
    };

    return (
        <Container maxWidth='xl'>
            <RequestSnackbar request={request} />

            <Stack spacing={4}>
                <TextField fullWidth select value={cohort} onChange={onChangeCohort}>
                    {dojoCohorts.map((cohort) => (
                        <MenuItem key={cohort} value={cohort}>
                            <CohortIcon
                                cohort={cohort}
                                sx={{ marginRight: '0.6em', verticalAlign: 'middle' }}
                                tooltip=''
                                size={25}
                            />{' '}
                            {cohort}
                        </MenuItem>
                    ))}
                </TextField>

                {!request.isSent() || request.isLoading() ? (
                    <LoadingPage />
                ) : request.data?.tournaments.length ? (
                    request.data.tournaments.map((t) => (
                        <Tournament key={t.id} tournament={t} />
                    ))
                ) : (
                    <Typography>No tournaments found</Typography>
                )}
            </Stack>
        </Container>
    );
}
