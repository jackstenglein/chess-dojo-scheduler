import React from 'react';
import { Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

interface Pairing {
    round: number;
    player1: string;
    player2: string;
}

const generateRandomPairings = (): Pairing[] => {
    const players = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const pairings: Pairing[] = [];

    for (let i = 1; i <= 5; i++) {
        const shuffledPlayers = players.sort(() => 0.5 - Math.random());
        for (let j = 0; j < shuffledPlayers.length; j += 2) {
            pairings.push({
                round: i,
                player1: shuffledPlayers[j],
                player2: shuffledPlayers[j + 1],
            });
        }
    }

    return pairings;
};

const PairingsPage: React.FC = () => {
    const pairings = generateRandomPairings();

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>

            <Typography variant="h4" textAlign={'center'} gutterBottom>
                Round-Robin Pairings
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Round</TableCell>
                            <TableCell>Player 1</TableCell>
                            <TableCell>Player 2</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pairings.map((pairing, index) => (
                            <TableRow key={index}>
                                <TableCell>{pairing.round}</TableCell>
                                <TableCell>{pairing.player1}</TableCell>
                                <TableCell>{pairing.player2}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

        </Container>
    );
};

export default PairingsPage;
