import CohortIcon from '@/scoreboard/CohortIcon';
import {
    Box,
    Card,
    CircularProgress,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { LineChart } from '@mui/x-charts';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { ROUND_ROBIN_COHORT_KEY } from './PairingPage';
import { cohorts, fetchTournamentData, TournamentId } from './roundRobinApi';
import { TournamentEntry } from './TournamentEntry';

export const StatPage = () => {
    const [selectedCohort, setSelectedCohort] = useLocalStorage<number>(
        ROUND_ROBIN_COHORT_KEY,
        0,
    );
    const [tournamentData, setTournamentData] = useState<TournamentId>();
    const [loading, setLoading] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<'count' | 'percentage'>('count'); // Toggle between count and percentage
    const [displayMode, setDisplayMode] = useState<'graph' | 'list'>('graph'); // Toggle between graph and list views

    const displayIcon =
        selectedCohort !== 0 ? `${selectedCohort}-${selectedCohort + 100}` : '0-300';

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    useEffect(() => {
        if (selectedCohort !== 0) {
            setLoading(true);
            fetchTournamentData(selectedCohort)
                .then(setTournamentData)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [selectedCohort]);

    const calculatePlayerStats = (players: string[], crosstable: string[][]) => {
        return players.map((player, index) => {
            let wins = 0,
                losses = 0,
                draws = 0;
            crosstable[index]?.forEach((result) => {
                if (result === '1') wins++;
                else if (result === '0') losses++;
                else if (result === '1/2') draws++;
            });
            return { player, wins, losses, draws };
        });
    };

    const calculateTimeElapsed = (start: Date, end: Date) => {
        const totalDuration = new Date(end).getTime() - new Date(start).getTime();
        const elapsed = new Date().getTime() - new Date(start).getTime();
        return roundval(elapsed, totalDuration);
    };

    const calculateTimeRemaining = (start: Date, end: Date) => {
        return 100 - parseInt(calculateTimeElapsed(start, end));
    };

    const calculateGameComp = (players: string[], games: string[]) => {
        return roundval(games.length, (players.length * (players.length - 1)) / 2);
    };

    const roundval = (start: number, end: number) => {
        return Math.min((start / end) * 100, 100).toFixed(2);
    };

    const renderLineGraph = (players: string[], crosstable: string[][]) => {
        const playerStats = calculatePlayerStats(players, crosstable);
        const playerNames = playerStats.map((stat) => stat.player);
        const totalGames = players.length - 1;

        const wins =
            viewMode === 'count'
                ? playerStats.map((stat) => stat.wins)
                : playerStats.map((stat) => +((stat.wins / totalGames) * 100).toFixed(2));
        const losses =
            viewMode === 'count'
                ? playerStats.map((stat) => stat.losses)
                : playerStats.map(
                      (stat) => +((stat.losses / totalGames) * 100).toFixed(2),
                  );
        const draws =
            viewMode === 'count'
                ? playerStats.map((stat) => stat.draws)
                : playerStats.map(
                      (stat) => +((stat.draws / totalGames) * 100).toFixed(2),
                  );

        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 400,
                }}
            >
                <LineChart
                    xAxis={[{ data: playerNames, scaleType: 'point' }]}
                    series={[
                        { data: wins, label: viewMode === 'count' ? 'Wins' : 'Win %' },
                        {
                            data: losses,
                            label: viewMode === 'count' ? 'Losses' : 'Loss %',
                        },
                        { data: draws, label: viewMode === 'count' ? 'Draws' : 'Draw %' },
                    ]}
                    width={1000}
                    height={400}
                />
            </Box>
        );
    };

    const renderListView = (players: string[], crosstable: string[][]) => {
        const playerStats = calculatePlayerStats(players, crosstable);
        const totalGames = players.length - 1;

        return (
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Player</TableCell>
                            <TableCell>
                                {viewMode === 'count' ? 'Wins' : 'Win %'}
                            </TableCell>
                            <TableCell>
                                {viewMode === 'count' ? 'Losses' : 'Loss %'}
                            </TableCell>
                            <TableCell>
                                {viewMode === 'count' ? 'Draws' : 'Draw %'}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {playerStats.map((stat, idx) => (
                            <TableRow key={idx}>
                                <TableCell>{stat.player}</TableCell>
                                <TableCell>
                                    {viewMode === 'count'
                                        ? stat.wins
                                        : ((stat.wins / totalGames) * 100).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    {viewMode === 'count'
                                        ? stat.losses
                                        : ((stat.losses / totalGames) * 100).toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    {viewMode === 'count'
                                        ? stat.draws
                                        : ((stat.draws / totalGames) * 100).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel id='cohort-selector-label'>Select Cohort</InputLabel>
                    <Select
                        labelId='cohort-selector-label'
                        value={selectedCohort}
                        onChange={handleCohortChange}
                        label='Select Cohort'
                    >
                        {cohorts.map((cohort) => (
                            <MenuItem key={cohort.value} value={cohort.value}>
                                <CohortIcon
                                    cohort={cohort.label}
                                    sx={{ marginRight: '0.6em', verticalAlign: 'middle' }}
                                    tooltip=''
                                    size={25}
                                />{' '}
                                {cohort.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_e, newViewMode) =>
                        newViewMode && setViewMode(newViewMode)
                    }
                    aria-label='view mode toggle'
                >
                    <ToggleButton value='count'>Count</ToggleButton>
                    <ToggleButton value='percentage'>Percentage</ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup
                    value={displayMode}
                    exclusive
                    onChange={(_e, newDisplayMode) =>
                        newDisplayMode && setDisplayMode(newDisplayMode)
                    }
                    aria-label='display mode toggle'
                >
                    <ToggleButton value='graph'>Graph</ToggleButton>
                    <ToggleButton value='list'>List</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading ? (
                <Box
                    display='flex'
                    justifyContent='center'
                    alignItems='center'
                    height='300px'
                >
                    <CircularProgress />
                </Box>
            ) : (
                tournamentData?.tournaments?.map((tournament, idx) => (
                    <Card key={idx} sx={{ mb: 4, p: 2 }}>
                        <TournamentEntry
                            cohort={displayIcon}
                            waiting={tournament.waiting}
                            startdate={tournament.startdate}
                            enddate={tournament.enddate}
                            entryName={tournament.name}
                            pannelName='Crosstable'
                            playerCount={tournament.players.length}
                            gameCount={tournament.gameSub.length}
                            tc={tournament.tc}
                            inc={tournament.inc}
                        />
                        <Typography variant='subtitle1' textAlign='center' gutterBottom>
                            Time Elapsed:{' '}
                            {calculateTimeElapsed(
                                tournament.startdate,
                                tournament.enddate,
                            )}
                            %{'  '}
                            Time Remaining{' '}
                            {calculateTimeRemaining(
                                tournament.startdate,
                                tournament.enddate,
                            )}
                            % Game completion:{' '}
                            {calculateGameComp(tournament.players, tournament.gameSub)}%
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            {displayMode === 'graph'
                                ? renderLineGraph(
                                      tournament.players,
                                      tournament.crosstabledata,
                                  )
                                : renderListView(
                                      tournament.players,
                                      tournament.crosstabledata,
                                  )}
                        </Box>
                    </Card>
                ))
            )}
        </Container>
    );
};
