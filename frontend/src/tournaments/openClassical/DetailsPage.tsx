import React, { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Button,
    Container,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { OpenClassical, OpenClassicalPairing } from '../../database/tournament';
import LoadingPage from '../../loading/LoadingPage';
import { useAuth } from '../../auth/Auth';
import Editor from './Editor';
import StandingsTable from './StandingsTable';

const DetailsPage = () => {
    const api = useApi();
    const request = useRequest<OpenClassical>();
    const user = useAuth().user;

    const onSuccess = request.onSuccess;
    const handleData = useCallback(
        (openClassical: OpenClassical) => {
            onSuccess(openClassical);
        },
        [onSuccess]
    );

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getOpenClassical()
                .then((resp) => {
                    console.log('getOpenClassical: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [api, request, handleData]);

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
                </Stack>
                {(user?.isAdmin || user?.isTournamentAdmin) && (
                    <Editor openClassical={request.data} onSuccess={handleData} />
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
    const [region, setRegion] = useState('A');
    const [section, setSection] = useState('Open');
    const [view, setView] = useState('standings');

    if (!openClassical) {
        return null;
    }

    if (openClassical.acceptingRegistrations) {
        return (
            <Stack mt={3} spacing={2} alignItems='start'>
                <Typography>
                    The tournament has not started yet. Round one begins Monday December
                    11th. Register beforehand if you would like to play
                </Typography>

                <Button variant='contained' href='/tournaments/open-classical/register'>
                    Register
                </Button>
            </Stack>
        );
    }

    const pairings =
        view === 'standings'
            ? []
            : openClassical.sections[`${region}_${section}`]?.rounds[parseInt(view) - 1]
                  ?.pairings ?? [];

    const maxRound = openClassical.sections[`${region}_${section}`]?.rounds.length || 0;

    return (
        <Stack mt={4} spacing={3}>
            <Typography>
                Results for each round will be posted after the full round is complete.{' '}
                <Link
                    component={RouterLink}
                    to='/tournaments/open-classical/submit-results'
                >
                    Submit Results
                </Link>
            </Typography>

            <Stack direction='row' width={1} spacing={2}>
                <TextField
                    label='Region'
                    select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
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
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <MenuItem value='Open'>Open</MenuItem>
                    <MenuItem value='U1800'>U1800</MenuItem>
                </TextField>

                <TextField
                    label='View'
                    select
                    value={view}
                    onChange={(e) => setView(e.target.value)}
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
            </Stack>

            {view === 'standings' ? (
                <StandingsTable
                    openClassical={openClassical}
                    region={region}
                    ratingRange={section}
                />
            ) : (
                <DataGrid
                    columns={pairingTableColumns}
                    rows={pairings}
                    getRowId={(pairing) =>
                        `${pairing.white.lichessUsername}-${pairing.black.lichessUsername}`
                    }
                    autoHeight
                />
            )}
        </Stack>
    );
};

const pairingTableColumns: GridColDef<OpenClassicalPairing>[] = [
    {
        field: 'whiteLichess',
        headerName: 'White (Lichess)',
        valueGetter: (params) =>
            `${params.row.white.lichessUsername}${
                params.row.white.rating ? ` (${params.row.white.rating})` : ''
            }`,
        flex: 1,
    },
    {
        field: 'whiteDiscord',
        headerName: 'White (Discord)',
        valueGetter: (params) => params.row.white.discordUsername,
        flex: 1,
    },
    {
        field: 'blackLichess',
        headerName: 'Black (Lichess)',
        valueGetter: (params) =>
            `${params.row.black.lichessUsername}${
                params.row.black.rating ? ` (${params.row.black.rating})` : ''
            }`,
        flex: 1,
    },
    {
        field: 'blackDiscord',
        headerName: 'Black (Discord)',
        valueGetter: (params) => params.row.black.discordUsername,
        flex: 1,
    },
    {
        field: 'result',
        headerName: 'Result',
        flex: 0.5,
        align: 'center',
        headerAlign: 'center',
    },
];

export default DetailsPage;
