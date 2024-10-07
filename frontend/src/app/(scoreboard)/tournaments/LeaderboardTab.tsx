'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { TimeControl, TimePeriod } from '@/api/tournamentApi';
import {
    Leaderboard,
    LeaderboardPlayer,
    LeaderboardSite,
    TournamentType,
} from '@/database/tournament';
import LoadingPage from '@/loading/LoadingPage';
import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { DataGridPro, GridColDef, GridRowModel } from '@mui/x-data-grid-pro';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import MonthDateButton from './MonthDateButton';
import YearDateButton from './YearDateButton';

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

    const [site, setSite] = useState<LeaderboardSite>(LeaderboardSite.Lichess);
    const [tournamentType, setTournamentType] = useState(TournamentType.Arena);
    const [timeControl, setTimeControl] = useState<TimeControl>('blitz');
    const [selectedDate, setSelectedDate] = useState(DateTime.now());
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getLeaderboard(
                site,
                timePeriod,
                tournamentType,
                timeControl,
                selectedDate.toUTC().toISO(),
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
    }, [request, api, site, timePeriod, tournamentType, timeControl, selectedDate]);

    const reset = request.reset;
    useEffect(() => {
        reset();
    }, [reset, site, tournamentType, timeControl, timePeriod, selectedDate]);

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
                        data-cy='site-control-selector'
                        select
                        label='Site'
                        value={site}
                        onChange={(e) => setSite(e.target.value as LeaderboardSite)}
                    >
                        <MenuItem value={LeaderboardSite.Lichess}>Lichess</MenuItem>
                        <MenuItem value={LeaderboardSite.Chesscom}>Chess.com</MenuItem>
                    </TextField>

                    <TextField
                        data-cy='time-control-selector'
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
                        data-cy='tournament-type-selector'
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

            <DataGridPro
                data-cy='leaderboard'
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
                pagination
            />
        </Stack>
    );
};

export default LeaderboardTab;
