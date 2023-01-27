import {
    Container,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import { GameInfo, GameResult } from '../database/game';
import GameListItem from './GameListItem';

const games: GameInfo[] = [
    {
        cohort: '1100-1200',
        id: '2022.02.26_a0b47295-5cb7-4409-b121-8db07cac869d',
        white: 'Jack Stenglein',
        black: 'agedwhitecheddar',
        date: '2022-01-01',
        owner: 'admin',
        headers: {
            White: 'Jack Stenglein',
            WhiteElo: '1700',
            Black: 'agedwhitecheddar',
            BlackElo: '2000',
            Date: '2022-01-01',
            Site: 'Lichess',
            Result: GameResult.White,
            PlyCount: '32',
        },
    },
    {
        cohort: '1300-1400',
        id: '2',
        white: 'Jack Stenglein',
        black: 'agedwhitecheddar',
        date: '2022-01-02',
        owner: 'admin',
        headers: {
            White: 'Jack Stenglein',
            WhiteElo: '1700',
            Black: 'agedwhitecheddar',
            BlackElo: '2000',
            Date: '2022-01-01',
            Site: 'Lichess',
            Result: GameResult.Black,
            PlyCount: '75',
        },
    },
    {
        cohort: '1500-1600',
        id: '3',
        white: 'Jack Stenglein',
        black: 'agedwhitecheddar',
        date: '2022-01-03',
        owner: 'admin',
        headers: {
            White: 'Jack Stenglein',
            WhiteElo: '1700',
            Black: 'agedwhitecheddar',
            BlackElo: '2000',
            Date: '2022-01-01',
            Site: 'Lichess',
            Result: GameResult.Draw,
            PlyCount: '86',
        },
    },
];

const ListGamesPage = () => {
    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Cohort</TableCell>
                        <TableCell>Players</TableCell>
                        <TableCell align='center'>Result</TableCell>
                        <TableCell align='center'>Moves</TableCell>
                        <TableCell align='right'>Date</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {games.map((game) => (
                        <GameListItem key={game.id} game={game} />
                    ))}
                </TableBody>
            </Table>
        </Container>
    );
};

export default ListGamesPage;
