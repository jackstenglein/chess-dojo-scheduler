import React, { useCallback, useEffect, useState } from 'react';
import { Button, Container, MenuItem, Stack, TextField, Typography } from '@mui/material';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { OpenClassical, OpenClassicalPairing } from '../../database/tournament';
import LoadingPage from '../../loading/LoadingPage';
import { useAuth } from '../../auth/Auth';
import Editor from './Editor';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const DetailsPage = () => {
    const api = useApi();
    const request = useRequest<OpenClassical>();
    const user = useAuth().user;
    const [round, setRound] = useState(0);

    const onSuccess = request.onSuccess;
    const handleData = useCallback(
        (openClassical: OpenClassical) => {
            setRound(openClassical.rounds?.length || 1);
            onSuccess(openClassical);
        },
        [setRound, onSuccess]
    );

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getOpenClassical()
                .then((resp) => {
                    console.log('getOpenClassical: ', resp);
                    handleData(resp.data);
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
                <Typography variant='h4'>Open Classical</Typography>

                {(user?.isAdmin || user?.isTournamentAdmin) && (
                    <Editor openClassical={request.data} onSuccess={handleData} />
                )}
            </Stack>

            <Details
                openClassical={request.data}
                round={round}
                setRound={setRound}
                maxRound={request.data?.rounds.length || 0}
            />
        </Container>
    );
};

interface DetailsProps {
    openClassical?: OpenClassical;
    round: number;
    setRound: (round: number) => void;
    maxRound: number;
}

const Details: React.FC<DetailsProps> = ({
    openClassical,
    round,
    setRound,
    maxRound,
}) => {
    if (!openClassical) {
        return null;
    }

    if (
        !openClassical.rounds ||
        openClassical.rounds.length === 0 ||
        openClassical.rounds.length < round
    ) {
        return (
            <Stack mt={2} spacing={1} alignItems='start'>
                <Typography>The tournament has not started yet</Typography>

                <Button variant='contained' href='/tournaments/open-classical/register'>
                    Register
                </Button>
            </Stack>
        );
    }

    console.log('Round: ', round);
    console.log('Max round: ', maxRound);

    return (
        <Stack mt={4} spacing={3}>
            <TextField
                label='Round'
                select
                value={round}
                onChange={(e) => setRound(parseInt(e.target.value))}
            >
                {Array(maxRound)
                    .fill(0)
                    .map((_, i) => (
                        <MenuItem key={i + 1} value={`${i + 1}`}>
                            {i + 1}
                        </MenuItem>
                    ))}
            </TextField>

            <DataGrid
                columns={pairingTableColumns}
                rows={openClassical.rounds[round - 1].pairings}
                getRowId={(pairing) =>
                    `${pairing.white.lichessUsername}-${pairing.black.lichessUsername}`
                }
                autoHeight
            />
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
];

export default DetailsPage;
