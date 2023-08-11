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
import React, { useEffect, useMemo } from 'react';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest, Request } from '../api/Request';
import { Tournament, TournamentType } from '../database/tournament';
import LoadingPage from '../loading/LoadingPage';
import { useSearchParams } from 'react-router-dom';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import LeaderboardTab from './LeaderboardTab';

const now = new Date().toISOString();

const TournamentListItem: React.FC<{ tournament: Tournament }> = ({ tournament }) => {
    return (
        <a
            href={tournament.url}
            target='__blank'
            rel='noreferrer'
            style={{ textDecoration: 'none' }}
        >
            <Card variant='outlined'>
                <CardHeader
                    title={tournament.name}
                    subheader={
                        <Stack>
                            <Typography color='text.secondary'>
                                {`${new Date(
                                    tournament.startsAt
                                ).toLocaleDateString()} • ${new Date(
                                    tournament.startsAt
                                ).toLocaleTimeString()}`}
                            </Typography>

                            <Typography color='text.secondary'>
                                {tournament.limitSeconds / 60}+
                                {tournament.incrementSeconds}
                                {tournament.lengthMinutes
                                    ? ` • ${tournament.lengthMinutes} min`
                                    : ''}
                            </Typography>

                            <Typography color='text.secondary'>
                                {tournament.rated ? 'Rated' : 'Unrated'}
                            </Typography>
                        </Stack>
                    }
                />

                {tournament.description && (
                    <CardContent>
                        <Typography>{tournament.description}</Typography>
                    </CardContent>
                )}
            </Card>
        </a>
    );
};

const TournamentsList: React.FC<{ type: string | null }> = ({ type }) => {
    const api = useApi();
    const request = useRequest<Tournament[]>();
    const tournamentType = type || TournamentType.Arena;

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

    const upcoming = useMemo(() => {
        return request.data?.filter((t) => t.startsAt >= now).reverse() || [];
    }, [request]);
    const previous = useMemo(() => {
        return request.data?.filter((t) => t.startsAt < now) || [];
    }, [request]);

    if (request.isLoading() || !request.isSent()) {
        return <LoadingPage />;
    }

    if (upcoming.length === 0 && previous.length === 0) {
        return (
            <Typography pt={2} variant='h6'>
                No tournaments found
            </Typography>
        );
    }

    return (
        <Stack spacing={4} pt={2}>
            {upcoming.length > 0 && (
                <Stack spacing={2}>
                    <Typography variant='h6'>Upcoming Tournaments</Typography>

                    {upcoming.map((t) => (
                        <TournamentListItem key={t.id} tournament={t} />
                    ))}
                </Stack>
            )}

            {previous.length > 0 && (
                <Stack spacing={2}>
                    <Typography variant='h6'>Previous Tournaments</Typography>

                    {previous.map((t) => (
                        <TournamentListItem key={t.id} tournament={t} />
                    ))}
                </Stack>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

const TournamentsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams({
        type: TournamentType.Arena,
    });

    return (
        <Container maxWidth='lg' sx={{ py: 5 }}>
            <TabContext value={searchParams.get('type') || TournamentType.Arena}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={(_, t) => setSearchParams({ type: t })}>
                        <Tab label='Arenas' value={TournamentType.Arena} />
                        <Tab label='Swiss' value={TournamentType.Swiss} />
                        <Tab label='Leaderboard' value='leaderboard' />
                    </TabList>
                </Box>

                <TabPanel value='leaderboard'>
                    <LeaderboardTab />
                </TabPanel>

                {searchParams.get('type') !== 'leaderboard' && (
                    <TournamentsList type={searchParams.get('type')} />
                )}
            </TabContext>
        </Container>
    );
};

export default TournamentsPage;
