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
    Typography,
} from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

interface Pairing {
    round: number;
    player1: string;
    player2: string;
}

interface TournamentData {
    info: string;
    tournamentname: string;
    pairs: string[][];
    message: string;
    desc: string;
    crosstable: string[][];
    crosstableString: string;
    leaderboard: string[];
    statusCode: number;
}

export const cohorts = [
    { label: '0-300', value: 0 },
    { label: '300-400', value: 300 },
    { label: '400-500', value: 400 },
    { label: '500-600', value: 500 },
    { label: '600-700', value: 600 },
    { label: '700-800', value: 700 },
    { label: '800-900', value: 800 },
    { label: '900-1000', value: 900 },
    { label: '1000-1100', value: 1000 },
    { label: '1100-1200', value: 1100 },
    { label: '1200-1300', value: 1200 },
    { label: '1300-1400', value: 1300 },
    { label: '1400-1500', value: 1400 },
    { label: '1500-1600', value: 1500 },
    { label: '1600-1700', value: 1600 },
    { label: '1700-1800', value: 1700 },
    { label: '1800-1900', value: 1800 },
    { label: '1900-2000', value: 1900 },
    { label: '2000-2100', value: 2000 },
    { label: '2100-2200', value: 2100 },
    { label: '2200-2300', value: 2200 },
    { label: '2300-2400', value: 2300 },
];

const PairingsPage: React.FC = () => {
    const [selectedCohort, setSelectedCohort] = useState<number>(0);
    const [selectedRound, setSelectedRound] = useState<number>(1);
    const [tournamentIds, setTournamentIds] = useState<string[]>([]);
    const [tournamentData, setTournamentData] = useState<TournamentData[]>([]);
    const authToken = 'my-token';
    const endpoint = 'https://vmqy3k7nj8.execute-api.us-east-1.amazonaws.com';

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    const handleRoundChange = (event: SelectChangeEvent<number>) => {
        setSelectedRound(Number(event.target.value));
    };

    const fetchTournamentIds = async (cohortValue: number) => {
        try {
            const response = await axios.get(endpoint + '/tournamentid', {
                headers: {
                    Authorization: authToken,
                    'cohort-start': cohortValue,
                },
            });

            const idsString = response.data.id;
            const ids = idsString.replace(/[\[\]]/g, '').split(',');

            setTournamentIds(ids);
        } catch (error) {
            console.error('Error fetching tournament IDs:', error);
        }
    };

    const fetchTournamentData = async (id: string) => {
        try {
            const response = await axios.get(endpoint + `/info`, {
                headers: {
                    Authorization: authToken,
                    tournamentid: id,
                },
            });

            const tournament = response.data as TournamentData;
            setTournamentData((prevData) => [...prevData, tournament]);
        } catch (error) {
            console.error('Error fetching tournament data:', error);
        }
    };

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
                            <Typography variant='h6' fontWeight={'body'}> Name: <Typography> {tournament.tournamentname}</Typography> </Typography>
                            <Typography variant='body1' fontWeight={'body'}> Description: <Typography> {tournament.desc}</Typography> </Typography>
                            <TableContainer sx={{ mt: 2 }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Pairings</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {tournament.pairs[selectedRound - 1]?.map(
                                            (pair, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{pair}</TableCell>
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
