import { useEffect, useState } from 'react';
import { MenuItem, Stack, TextField, Button } from '@mui/material';
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Leaderboard, LeaderboardPlayer, TournamentType } from '../database/tournament';
import LoadingPage from '../loading/LoadingPage';
import MonthDateButton from './MonthDateButton';
import YearDateButton from './YearDateButton';
import { TimeControl, TimePeriod } from '../api/tournamentApi';

const columns: GridColDef<LeaderboardPlayer>[] = [
    {
        field: 'rank',
        headerName: 'Rank',
    },
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

const LeaderboardTab = () => {
    const api = useApi();
    const request = useRequest<Leaderboard>();

    const [tournamentType, setTournamentType] = useState(TournamentType.Arena);
    const [timeControl, setTimeControl] = useState<TimeControl>('blitz');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getLeaderboard(
                timePeriod,
                tournamentType,
                timeControl,
                selectedDate.toISOString()
            )
                .then((resp) => {
                    resp.data.players =
                        resp.data.players?.map((p, idx) => ({
                            ...p,
                            rank: idx + 1,
                        })) || [];
                    console.log('getLeaderboard: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, api, timePeriod, tournamentType, timeControl, selectedDate]);

    const reset = request.reset;
    useEffect(() => {
        reset();
    }, [reset, tournamentType, timeControl, timePeriod, selectedDate]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Stack spacing={2}>
            <RequestSnackbar request={request} />

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
                        label='Time Control'
                        value={timeControl}
                        onChange={(e) => setTimeControl(e.target.value as TimeControl)}
                    >
                        <MenuItem value={'blitz'}>Blitz</MenuItem>
                        <MenuItem value={'rapid'}>Rapid</MenuItem>
                        <MenuItem value={'classical'}>Classical</MenuItem>
                    </TextField>

                    <TextField
                        sx={{ minWidth: 130 }}
                        select
                        label='Tournament Type'
                        value={tournamentType}
                        onChange={(e) =>
                            setTournamentType(e.target.value as TournamentType)
                        }
                    >
                        <MenuItem value={TournamentType.Arena}>Arena</MenuItem>
                        <MenuItem value={TournamentType.Swiss}>Swiss</MenuItem>
                        <MenuItem value={TournamentType.GrandPrix}>Grand Prix</MenuItem>
                        <MenuItem value={TournamentType.MiddlegameSparring}>
                            Middlegame Sparring
                        </MenuItem>
                        <MenuItem value={TournamentType.EndgameSparring}>
                            Endgame Sparring
                        </MenuItem>
                    </TextField>
                </Stack>

                <Stack direction='row' alignItems='center'>
                    {timePeriod === 'monthly' && (
                        <MonthDateButton
                            selectedDate={selectedDate}
                            onChange={setSelectedDate}
                        />
                    )}
                    {timePeriod === 'yearly' && (
                        <YearDateButton
                            selectedDate={selectedDate}
                            onChange={setSelectedDate}
                        />
                    )}

                    <Button
                        color={timePeriod === 'monthly' ? 'primary' : 'inherit'}
                        onClick={() => setTimePeriod('monthly')}
                    >
                        Monthly
                    </Button>
                    <Button
                        color={timePeriod === 'yearly' ? 'primary' : 'inherit'}
                        onClick={() => setTimePeriod('yearly')}
                    >
                        Yearly
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
    );
};

export default LeaderboardTab;
