import { Link } from '@/components/navigation/Link';
import {
    RoundRobin,
    RoundRobinPairing,
    RoundRobinPlayerStatuses,
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

interface RoundRobinCompletedGame extends RoundRobinPairing {
    white: string;
    black: string;
    url: string;
    round: number;
}

/**
 * Renders the games for the given Round Robin tournament.
 * @param tournament The tournament to render the games for.
 */
export function Games({ tournament }: { tournament: RoundRobin }) {
    const games: RoundRobinCompletedGame[] = [];
    for (let round = 0; round < tournament.pairings.length; round++) {
        for (const p of tournament.pairings[round]) {
            if (p.url && p.white && p.black) {
                games.push({ ...p, white: p.white, black: p.black, url: p.url, round: round + 1 });
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
                                    {tournament.players[game.white].status ===
                                        RoundRobinPlayerStatuses.WITHDRAWN && ' (Withdrawn)'}
                                </Typography>
                            </TableCell>
                            <TableCell align='center'>
                                <Typography>
                                    <Link href={`/profile/${game.black}`}>
                                        {tournament.players[game.black].displayName}
                                    </Link>
                                    {tournament.players[game.black].status ===
                                        RoundRobinPlayerStatuses.WITHDRAWN && ' (Withdrawn)'}
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
