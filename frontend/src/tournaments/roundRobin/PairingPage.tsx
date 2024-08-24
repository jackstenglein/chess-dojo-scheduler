import CohortIcon from '@/scoreboard/CohortIcon';
import {
    Box,
    Card,
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
import React, { useEffect, useState } from 'react';
import {
    cohorts,
    fetchTournamentData,
    fetchTournamentIds,
    TournamentData,
} from './roundRobinApi';

const PairingsPage: React.FC = () => {
    const [selectedCohort, setSelectedCohort] = useState<number>(0);
    const [selectedRound, setSelectedRound] = useState<number>(1);
    const [tournamentIds, setTournamentIds] = useState<string[]>([]);
    const [tournamentData, setTournamentData] = useState<TournamentData[]>([]);

    useEffect(() => {
        if (selectedCohort !== 0) {
            fetchTournamentIds(selectedCohort)
                .then(setTournamentIds)
                .catch(console.error);
        }
    }, [selectedCohort]);

    useEffect(() => {
        if (tournamentIds.length > 0) {
            setTournamentData([]);
            Promise.all(tournamentIds.map((id) => fetchTournamentData(id)))
                .then(setTournamentData)
                .catch(console.error);
        }
    }, [tournamentIds]);

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    const handleRoundChange = (event: SelectChangeEvent<number>) => {
        setSelectedRound(Number(event.target.value));
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

            {tournamentData.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    {tournamentData.map((tournament) => (
                        <div key={tournament.info}>
                            <TableContainer sx={{ mt: 2 }} component={Card}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <Typography
                                                    variant='h6'
                                                    textAlign={'left'}
                                                >
                                                    {' '}
                                                    {tournament.tournamentname}{' '}
                                                    {' Tournament Pairings'}{' '}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tournament.pairs[selectedRound - 1]?.map(
                                            (pair, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Typography textAlign={'left'}>
                                                            {pair.replaceAll('**', '')}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    ))}
                </Box>
            )}
        </Container>
    );
};

export default PairingsPage;
