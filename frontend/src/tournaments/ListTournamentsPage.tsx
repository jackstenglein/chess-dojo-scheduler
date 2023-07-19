import {
    Box,
    Card,
    CardContent,
    CardHeader,
    Container,
    Stack,
    Tab,
    Typography,
} from '@mui/material';
import { useEffect } from 'react';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Tournament, TournamentType } from '../database/tournament';
import LoadingPage from '../loading/LoadingPage';
import { useSearchParams } from 'react-router-dom';
import { TabContext, TabList } from '@mui/lab';

const ListTournamentsPage = () => {
    const api = useApi();
    const request = useRequest<Tournament[]>();
    const [searchParams, setSearchParams] = useSearchParams({
        type: TournamentType.Arena,
    });

    const tournamentType = searchParams.get('type') || TournamentType.Arena;

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listTournaments(tournamentType as TournamentType)
                .then((tournaments) => request.onSuccess(tournaments))
                .catch((err) => {
                    console.error('listTournaments: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api, tournamentType]);

    const reset = request.reset;
    useEffect(() => {
        reset();
    }, [reset, tournamentType]);

    return (
        <Container maxWidth='lg' sx={{ py: 5 }}>
            <TabContext value={searchParams.get('type') || TournamentType.Arena}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={(_, t) => setSearchParams({ type: t })}>
                        <Tab label='Arenas' value={TournamentType.Arena} />
                        <Tab label='Swiss' value={TournamentType.Swiss} />
                    </TabList>
                </Box>
            </TabContext>

            <Stack spacing={2} pt={2}>
                {(request.isLoading() || !request.isSent()) && <LoadingPage />}

                {!request.isLoading() &&
                    request.isSent() &&
                    (request.data === undefined || request.data.length === 0) && (
                        <Typography>No tournaments found</Typography>
                    )}

                {request.data?.map((t) => (
                    <a
                        key={t.id}
                        href={t.url}
                        target='__blank'
                        rel='noreferrer'
                        style={{ textDecoration: 'none' }}
                    >
                        <Card variant='outlined'>
                            <CardHeader
                                title={t.name}
                                subheader={
                                    <Stack>
                                        <Typography color='text.secondary'>
                                            {`
                        ${new Date(t.startsAt).toLocaleDateString()} • ${new Date(
                                                t.startsAt
                                            ).toLocaleTimeString()}`}
                                        </Typography>

                                        <Typography color='text.secondary'>
                                            {t.limitSeconds / 60}+{t.incrementSeconds}
                                            {t.lengthMinutes
                                                ? ` • ${t.lengthMinutes} min`
                                                : ''}
                                        </Typography>

                                        <Typography color='text.secondary'>
                                            {t.rated ? 'Rated' : 'Unrated'}
                                        </Typography>
                                    </Stack>
                                }
                            />

                            {t.description && (
                                <CardContent>
                                    <Typography>{t.description}</Typography>
                                </CardContent>
                            )}
                        </Card>
                    </a>
                ))}
            </Stack>

            <RequestSnackbar request={request} />
        </Container>
    );
};

export default ListTournamentsPage;
