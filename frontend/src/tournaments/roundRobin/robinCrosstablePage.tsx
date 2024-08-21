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
} from '@mui/material';
import React, { useState } from 'react';
import { cohorts } from './robinPairingPage';
interface PlayerResult {
    player: string;
    scores: number[];
    total: number;
}

const generateRandomCrosstableData = (): PlayerResult[] => {
    const players = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const playerCount = players.length;
    const results: PlayerResult[] = players.map((player) => {
        const scores = Array.from({ length: playerCount }, () =>
            Math.floor(Math.random() * 2),
        ); // 0, 0.5, or 1
        const total = scores.reduce((acc, score) => acc + score, 0);
        return { player, scores, total };
    });
    return results;
};

const Crosstable: React.FC = () => {
    const [selectedCohort, setSelectedCohort] = useState<number>(0);

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    const crosstableData = generateRandomCrosstableData();

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

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Player</TableCell>
                            {crosstableData.map((result, index) => (
                                <TableCell key={index}>{result.player}</TableCell>
                            ))}
                            <TableCell>Total</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {crosstableData.map((result, index) => (
                            <TableRow key={index}>
                                <TableCell>{result.player}</TableCell>
                                {result.scores.map((score, scoreIndex) => (
                                    <TableCell key={scoreIndex}>{score}</TableCell>
                                ))}
                                <TableCell>{result.total}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default Crosstable;
