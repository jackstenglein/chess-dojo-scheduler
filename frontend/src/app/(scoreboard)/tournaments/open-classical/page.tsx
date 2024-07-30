import {
    Button,
    Container,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import { toDojoDateString } from '../../calendar/displayDate';
import { OpenClassical } from '../../database/tournament';
import LoadingPage from '../../loading/LoadingPage';
import EntrantsTable from './EntrantsTable';
import PairingsTable from './PairingsTable';
import StandingsTable from './StandingsTable';

const DetailsPage = () => {
    const api = useApi();
    const request = useRequest<OpenClassical>();
    const user = useAuth().user;
    const [searchParams] = useSearchParams({ tournament: 'CURRENT' });
    const tournament = searchParams.get('tournament') || 'CURRENT';
    const navigate = useNavigate();

    const onSuccess = request.onSuccess;
    const handleData = useCallback(
        (openClassical: OpenClassical) => {
            onSuccess(openClassical);
        },
        [onSuccess],
    );

    const reset = request.reset;
    useEffect(() => {
        if (tournament) {
            reset();
        }
    }, [reset, tournament]);

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getOpenClassical(tournament)
                .then((resp) => {
                    console.log('getOpenClassical: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [api, request, handleData, tournament]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <Stack>
                    <Typography variant='h4'>Open Classical</Typography>
                    <Link component={RouterLink} to='/tournaments/open-classical/info'>
                        Rules and Info
                    </Link>
                    <Link
                        component={RouterLink}
                        to='/tournaments/open-classical/previous'
                    >
                        Previous Tournaments
                    </Link>
                </Stack>

                {(user?.isAdmin || user?.isTournamentAdmin) && (
                    <Button variant='contained' onClick={() => navigate('./admin')}>
                        Admin Portal
                    </Button>
                )}
            </Stack>

            <Details openClassical={request.data} />
        </Container>
    );
};

interface DetailsProps {
    openClassical?: OpenClassical;
}

const Details: React.FC<DetailsProps> = ({ openClassical }) => {
    const [searchParams, setSearchParams] = useSearchParams({
        region: 'A',
        ratingRange: 'Open',
        view: 'standings',
    });
    const viewer = useAuth().user;

    if (!openClassical) {
        return null;
    }

    const region = searchParams.get('region') || 'A';
    const ratingRange = searchParams.get('ratingRange') || 'Open';
    const view = searchParams.get('view') || 'standings';

    const maxRound =
        openClassical.sections[`${region}_${ratingRange}`]?.rounds.length || 0;

    const updateSearchParams = (key: string, value: string) => {
        const updatedParams = new URLSearchParams(searchParams.toString());
        updatedParams.set(key, value);
        setSearchParams(updatedParams);
    };

    const registrationCloseDate = openClassical.registrationClose
        ? toDojoDateString(
              new Date(openClassical.registrationClose),
              viewer?.timezoneOverride,
              undefined,
              { month: 'long', day: 'numeric' },
          )
        : null;

    return (
        <Stack mt={4} spacing={3}>
            {openClassical.acceptingRegistrations ? (
                <Stack mt={4} pb={5} spacing={2} alignItems='start'>
                    <Typography>
                        The tournament is still accepting registrations. Round one begins{' '}
                        {registrationCloseDate || 'soon'}. Register beforehand if you
                        would like to play.
                    </Typography>

                    <Button
                        variant='contained'
                        href='/tournaments/open-classical/register'
                    >
                        Register
                    </Button>
                </Stack>
            ) : openClassical.startsAt === 'CURRENT' ? (
                <Typography>
                    Results for each round will be posted after the full round is
                    complete.{' '}
                    <Link
                        component={RouterLink}
                        to='/tournaments/open-classical/submit-results'
                    >
                        Submit Results
                    </Link>
                </Typography>
            ) : (
                <Typography>Results from the {openClassical.name} tournament:</Typography>
            )}

            <Stack direction='row' width={1} spacing={2}>
                <TextField
                    label='Region'
                    select
                    value={region}
                    onChange={(e) => updateSearchParams('region', e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <MenuItem value='A'>Region A (Americas)</MenuItem>
                    <MenuItem value='B'>Region B (Eurasia/Africa/Oceania)</MenuItem>
                </TextField>

                <TextField
                    data-cy='section'
                    label='Section'
                    select
                    value={ratingRange}
                    onChange={(e) => updateSearchParams('ratingRange', e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <MenuItem value='Open'>Open</MenuItem>
                    <MenuItem value='U1800'>U1800</MenuItem>
                </TextField>

                {!openClassical.acceptingRegistrations && (
                    <TextField
                        label='View'
                        select
                        value={view}
                        onChange={(e) => updateSearchParams('view', e.target.value)}
                        sx={{
                            flexGrow: 1,
                        }}
                    >
                        <MenuItem value='standings'>Overall Standings</MenuItem>
                        {Array(maxRound)
                            .fill(0)
                            .map((_, i) => (
                                <MenuItem key={i + 1} value={`${i + 1}`}>
                                    Round {i + 1}
                                </MenuItem>
                            ))}
                    </TextField>
                )}
            </Stack>

            {openClassical.acceptingRegistrations ? (
                <EntrantsTable
                    openClassical={openClassical}
                    region={region}
                    ratingRange={ratingRange}
                />
            ) : view === 'standings' ? (
                <StandingsTable
                    openClassical={openClassical}
                    region={region}
                    ratingRange={ratingRange}
                />
            ) : (
                <PairingsTable
                    openClassical={openClassical}
                    region={region}
                    ratingRange={ratingRange}
                    round={parseInt(view)}
                />
            )}
        </Stack>
    );
};

export default DetailsPage;
