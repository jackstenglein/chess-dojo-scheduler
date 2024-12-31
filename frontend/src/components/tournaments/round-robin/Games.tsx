import { Link } from '@/components/navigation/Link';
import {
    RoundRobin,
    RoundRobinPairing,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

/**
 * Renders the games for the given Round Robin tournament.
 * @param tournament The tournament to render the games for.
 */
export function Games({ tournament }: { tournament: RoundRobin }) {
    const games: (RoundRobinPairing & { round: number })[] = [];
    for (let round = 0; round < tournament.pairings.length; round++) {
        for (const p of tournament.pairings[round]) {
            if (p.url) {
                games.push({ ...p, round: round + 1 });
            }
        }
    }

    if (games.length === 0) {
        return <Typography textAlign='center'>No games submitted yet</Typography>;
    }

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell align='center'>
                            <Typography sx={{ fontWeight: 'bold' }}>Round</Typography>
                        </TableCell>
                        <TableCell align='center'>
                            <Typography sx={{ fontWeight: 'bold' }}>White</Typography>
                        </TableCell>
                        <TableCell align='center'>
                            <Typography sx={{ fontWeight: 'bold' }}>Black</Typography>
                        </TableCell>
                        <TableCell align='center'>
                            <Typography sx={{ fontWeight: 'bold' }}>Result</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {games.map((game) => (
                        <TableRow key={game.url}>
                            <TableCell align='center'>
                                <Typography>{game.round}</Typography>
                            </TableCell>
                            <TableCell align='center'>
                                <Typography>
                                    <Link href={`/profile/${game.white}`}>
                                        {tournament.players[game.white].displayName}
                                    </Link>
                                </Typography>
                            </TableCell>
                            <TableCell align='center'>
                                <Typography>
                                    <Link href={`/profile/${game.black}`}>
                                        {tournament.players[game.black].displayName}
                                    </Link>
                                </Typography>
                            </TableCell>
                            <TableCell align='center'>
                                <Typography>
                                    <Link href={game.url}>{game.result}</Link>
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
