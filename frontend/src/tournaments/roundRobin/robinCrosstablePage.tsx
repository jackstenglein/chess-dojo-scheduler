import {
    Box,
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
    Card,
    Typography,
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { cohorts, TournamentData, fetchTournamentData, fetchTournamentIds } from './roundRobinApi';

const Crosstable: React.FC = () => {
    const [selectedCohort, setSelectedCohort] = useState<number>(0);
    const [tournamentIds, setTournamentIds] = useState<string[]>([]);
    const [tournamentData, setTournamentData] = useState<TournamentData[]>([]);
   

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    useEffect(() => {
        if (selectedCohort !== 0) {
            fetchTournamentIds(selectedCohort).then(setTournamentIds).catch(console.error);
        }
    }, [selectedCohort]);

    useEffect(() => {
        if (tournamentIds.length > 0) {
            setTournamentData([]); // Clear previous tournament data
            Promise.all(tournamentIds.map((id) => fetchTournamentData(id)))
                .then(setTournamentData)
                .catch(console.error);
        }
    }, [tournamentIds]);

    useEffect(() => {
        if (selectedCohort !== 0) {
            fetchTournamentIds(selectedCohort);
        }
    }, [selectedCohort]);

    useEffect(() => {
        if (tournamentIds.length > 0) {
            setTournamentData([]); // Clear previous tournament data
            tournamentIds.forEach((id) => {
                fetchTournamentData(id);
            });
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
                                {cohort.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            
            
            {tournamentData.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    {tournamentData.map((tournament, idx) => (
                        <div key={idx}>
                            <TableContainer sx={{ mt: 2 }} component={Card}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>
                                                <Typography variant='h6' textAlign={'left'}>
                                                    {tournament.tournamentname} Crosstable
                                                </Typography>
                                            </TableCell>
                                            {tournament.leaderboard.map((player, index) => (
                                                <TableCell key={index}>{player}</TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tournament.crosstable.map((row, rowIndex) => (
                                            <TableRow key={rowIndex}>
                                                <TableCell>
                                                    {tournament.leaderboard[rowIndex]}
                                                </TableCell>
                                                {row.map((result, colIndex) => (
                                                    <TableCell key={colIndex}>
                                                        {result}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
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

export default Crosstable;

