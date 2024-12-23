import CohortIcon from '@/scoreboard/CohortIcon';
import Circle from '@mui/icons-material/Circle';
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
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { cohorts, fetchTournamentData, TournamentId } from './roundRobinApi';
import { TournamentEntry } from './TournamentEntry';
export const ROUND_ROBIN_COHORT_KEY = 'ROUND_ROBIN_COHORT';

export const PairingsPage = () => {
    const [selectedCohort, setSelectedCohort] = useLocalStorage<number>(
        ROUND_ROBIN_COHORT_KEY,
        0,
    );
    const [selectedRound, setSelectedRound] = useState<number>(1);
    const [tournamentData, setTournamentData] = useState<TournamentId>();
    const [loading, setLoading] = useState<boolean>(false);
    const displayIcon =
        selectedCohort !== 0 ? `${selectedCohort}-${selectedCohort + 100}` : '0-300';

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    const handleRoundChange = (event: SelectChangeEvent<number>) => {
        setSelectedRound(Number(event.target.value));
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

                <FormControl fullWidth>
                    <InputLabel id='round-selector-label'>Select Round</InputLabel>
                    <Select
                        labelId='round-selector-label'
                        value={selectedRound}
                        onChange={handleRoundChange}
                        label='Select Round'
                    >
                        {[...Array(9).keys()].map((round) => (
                            <MenuItem key={round + 1} value={round + 1}>
                                Round {round + 1}
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
                    {tournamentData?.tournaments !== undefined ? (
                        <Box sx={{ mb: 3 }}>
                            {tournamentData?.tournaments.map((tournament) => (
                                <TableContainer
                                    sx={{ mt: 2 }}
                                    component={Card}
                                    key={tournament.id}
                                >
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    <TournamentEntry
                                                        cohort={displayIcon}
                                                        waiting={tournament.waiting}
                                                        startdate={tournament.startdate}
                                                        enddate={tournament.enddate}
                                                        entryName={tournament.name}
                                                        pannelName='Pairings'
                                                        playerCount={
                                                            tournament.players.length
                                                        }
                                                        gameCount={
                                                            tournament.gameSub.length
                                                        }
                                                        tc={tournament.tc}
                                                        inc={tournament.inc}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {tournament.pairingdata?.[
                                                selectedRound - 1
                                            ] ? (
                                                tournament.pairingdata[
                                                    selectedRound - 1
                                                ]?.map((pair, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Typography
                                                                textAlign={'center'}
                                                            >
                                                                {
                                                                    <Circle
                                                                        sx={{
                                                                            verticalAlign:
                                                                                'middle',
                                                                            marginRight: 3,
                                                                            color: 'white',
                                                                        }}
                                                                    />
                                                                }{' '}
                                                                {pair.replaceAll(
                                                                    '**',
                                                                    '',
                                                                )}{' '}
                                                                {
                                                                    <Circle
                                                                        sx={{
                                                                            verticalAlign:
                                                                                'middle',
                                                                            marginLeft: 1,
                                                                            color: 'grey',
                                                                        }}
                                                                    />
                                                                }
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={2}>
                                                        <Typography textAlign={'center'}>
                                                            No pairings available for this
                                                            round.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant='h6' textAlign={'center'}>
                            No tournament data available.
                        </Typography>
                    )}
                </>
            )}
        </Container>
    );
};
