import React from 'react';
import { Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

interface PlayerResult {
    player: string;
    scores: number[];
    total: number;
}

const generateRandomCrosstableData = (): PlayerResult[] => {
    const players = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const playerCount = players.length;
    const results: PlayerResult[] = players.map(player => {
        const scores = Array.from({ length: playerCount }, () => Math.floor(Math.random() * 2)); // 0, 0.5, or 1
        const total = scores.reduce((acc, score) => acc + score, 0);
        return { player, scores, total };
    });
    return results;
};

const Crosstable: React.FC = () => {
    const crosstableData = generateRandomCrosstableData();

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <Typography variant="h4" textAlign={'center'} gutterBottom>
                Chess Crosstable
            </Typography>
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
