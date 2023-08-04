import { useEffect, useState } from 'react';
import {
    Container,
    FormControl,
    FormControlLabel,
    FormLabel,
    InputLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Stack,
    TextField,
    Typography,
    Button,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Leaderboard, LeaderboardPlayer, TournamentType } from '../database/tournament';
import LoadingPage from '../loading/LoadingPage';
import MonthDateButton from './MonthDateButton';
import YearDateButton from './YearDateButton';

const columns: GridColDef<LeaderboardPlayer>[] = [
    {
        field: 'username',
        headerName: 'Lichess Username',
        minWidth: 250,
        flex: 1,
    },
    {
        field: 'rating',
        headerName: 'Lichess Rating',
        minWidth: 100,
        flex: 1,
    },
    {
        field: 'score',
        headerName: 'Score',
        minWidth: 100,
        flex: 1,
    },
];

type View = 'month' | 'year';

const LeaderboardPage = () => {
    const api = useApi();
    const request = useRequest<Leaderboard>();

    const [tournamentType, setTournamentType] = useState(TournamentType.Arena);
    const [timeControl, setTimeControl] = useState('blitz');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<View>('month');

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getLeaderboard('monthly', TournamentType.Arena, 'blitz')
                .then((resp) => {
                    console.log('getLeaderboard: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container maxWidth='lg' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={2}>
                <Typography variant='h5' sx={{ mb: 3 }}>
                    Tournament Leaderboard
                </Typography>

                <Stack
                    direction='row'
                    spacing={2}
                    flexWrap='wrap'
                    rowGap={2}
                    justifyContent='space-between'
                >
                    <Stack direction='row' spacing={2}>
                        <TextField
                            sx={{ minWidth: 130 }}
                            select
                            label='Tournament Type'
                            value={tournamentType}
                        >
                            <MenuItem value={TournamentType.Arena}>Arena</MenuItem>
                            <MenuItem value={TournamentType.Swiss}>Swiss</MenuItem>
                            <MenuItem value={TournamentType.GrandPrix}>
                                Grand Prix
                            </MenuItem>
                        </TextField>

                        <TextField
                            sx={{ minWidth: 130 }}
                            select
                            label='Time Control'
                            value={timeControl}
                        >
                            <MenuItem value={'blitz'}>Blitz</MenuItem>
                            <MenuItem value={'rapid'}>Rapid</MenuItem>
                            <MenuItem value={'classical'}>Classical</MenuItem>
                        </TextField>
                    </Stack>

                    <Stack direction='row' alignItems='center'>
                        {view === 'month' && (
                            <MonthDateButton
                                selectedDate={selectedDate}
                                onChange={setSelectedDate}
                            />
                        )}
                        {view === 'year' && (
                            <YearDateButton
                                selectedDate={selectedDate}
                                onChange={setSelectedDate}
                            />
                        )}

                        <Button
                            color={view === 'month' ? 'primary' : 'inherit'}
                            onClick={() => setView('month')}
                        >
                            Month
                        </Button>
                        <Button
                            color={view === 'year' ? 'primary' : 'inherit'}
                            onClick={() => setView('year')}
                        >
                            Year
                        </Button>
                    </Stack>
                </Stack>

                <DataGrid
                    autoHeight
                    columns={columns}
                    rows={request.data?.players || []}
                    loading={request.isLoading()}
                    getRowId={(row: GridRowModel<LeaderboardPlayer>) => row.username}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        sorting: {
                            sortModel: [{ field: 'score', sort: 'desc' }],
                        },
                        pagination: {
                            paginationModel: { page: 0, pageSize: 10 },
                        },
                    }}
                />
            </Stack>
        </Container>
    );
};

export default LeaderboardPage;
