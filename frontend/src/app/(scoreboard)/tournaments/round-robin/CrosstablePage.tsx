import CohortIcon from '@/scoreboard/CohortIcon';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import TableChartIcon from '@mui/icons-material/TableChart';
import {
    Box,
    Button,
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
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { ROUND_ROBIN_COHORT_KEY } from './PairingPage';
import {
    cohorts,
    fetchTournamentData,
    fetchTournamentIds,
    TournamentData,
} from './roundRobinApi';

/**
 * handles the crosstable UI menu
 * @returns display tournament crosstables
 */
export const Crosstable = () => {
    const [selectedCohort, setSelectedCohort] = useLocalStorage<number>(
        ROUND_ROBIN_COHORT_KEY,
        0,
    );
    const [tournamentIds, setTournamentIds] = useState<string[]>([]);
    const [tournamentData, setTournamentData] = useState<TournamentData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [showLeaderboard, setShowLeaderboard] = useState<Record<string, boolean>>({});
    const displayIcon =
        selectedCohort !== 0 ? `${selectedCohort}-${selectedCohort + 100}` : '0-300';

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    const toggleView = (tournamentId: string) => {
        setShowLeaderboard((prev) => ({
            ...prev,
            [tournamentId]: !prev[tournamentId],
        }));
    };

    useEffect(() => {
        if (selectedCohort !== 0) {
            setLoading(true);
            fetchTournamentIds(selectedCohort)
                .then(setTournamentIds)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [selectedCohort]);

    useEffect(() => {
        if (tournamentIds.length > 0) {
            setLoading(true);
            setTournamentData([]);
            Promise.all(tournamentIds.map((id) => fetchTournamentData(id)))
                .then((data) => {
                    setTournamentData((prevData) => [...prevData, ...data]);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        } else {
            setTournamentData([]); // Reset if no tournament IDs
        }
    }, [tournamentIds]);

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
                <>
                    {tournamentData.length > 0 ? (
                        <Box sx={{ mb: 3 }}>
                            {tournamentData.map((tournament, idx) => (
                                <Card key={idx} sx={{ mb: 4, p: 2 }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Typography variant='h6'>
                                            <CohortIcon
                                                cohort={displayIcon}
                                                sx={{
                                                    marginRight: '0.6em',
                                                    verticalAlign: 'middle',
                                                }}
                                                tooltip=''
                                                size={25}
                                            />{' '}
                                            {tournament.tournamentname}{' '}
                                            {showLeaderboard[tournament.info]
                                                ? 'Leaderboard'
                                                : 'Crosstable'}{' '}
                                            {tournament.players.length < 10
                                                ? '[Registration Open]'
                                                : '[Tournament Started]'}{' '}
                                            {'Size: '}
                                            {tournament.players.length}
                                        </Typography>
                                        <Button
                                            variant='contained'
                                            startIcon={
                                                showLeaderboard[tournament.info] ? (
                                                    <TableChartIcon />
                                                ) : (
                                                    <LeaderboardIcon />
                                                )
                                            }
                                            onClick={() => toggleView(tournament.info)}
                                        >
                                            {showLeaderboard[tournament.info]
                                                ? 'Crosstable'
                                                : 'Leaderboard'}
                                        </Button>
                                    </Box>

                                    {showLeaderboard[tournament.info] ? (
                                        tournament.leaderboard && tournament.scores ? (
                                            <TableContainer sx={{ mt: 2 }}>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Rank</TableCell>
                                                            <TableCell>Player</TableCell>
                                                            <TableCell>Score</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {tournament.leaderboard.map(
                                                            (player, index) => (
                                                                <TableRow key={index}>
                                                                    <TableCell>
                                                                        {index + 1}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {player}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            tournament
                                                                                .scores[
                                                                                index
                                                                            ]
                                                                        }
                                                                    </TableCell>
                                                                </TableRow>
                                                            ),
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Typography
                                                textAlign={'center'}
                                                sx={{ mt: 2 }}
                                            >
                                                No leaderboard data available.
                                            </Typography>
                                        )
                                    ) : tournament.crosstable && tournament.players ? (
                                        <TableContainer sx={{ mt: 2 }}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Player</TableCell>
                                                        {tournament.players.map(
                                                            (player, index) => (
                                                                <TableCell key={index}>
                                                                    {player}
                                                                </TableCell>
                                                            ),
                                                        )}
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {tournament.crosstable.map(
                                                        (row, rowIndex) => (
                                                            <TableRow key={rowIndex}>
                                                                <TableCell>
                                                                    {
                                                                        tournament
                                                                            .players[
                                                                            rowIndex
                                                                        ]
                                                                    }
                                                                </TableCell>
                                                                {row.map(
                                                                    (
                                                                        result,
                                                                        colIndex,
                                                                    ) => (
                                                                        <TableCell
                                                                            key={colIndex}
                                                                        >
                                                                            {result}
                                                                        </TableCell>
                                                                    ),
                                                                )}
                                                            </TableRow>
                                                        ),
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    ) : (
                                        <Typography textAlign={'center'} sx={{ mt: 2 }}>
                                            No crosstable data available.
                                        </Typography>
                                    )}
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant='h6' textAlign={'center'} sx={{ mt: 2 }}>
                            No tournament data available.
                        </Typography>
                    )}
                </>
            )}
        </Container>
    );
};
