import { Link } from '@/components/navigation/Link';
import {
    RoundRobin,
    RoundRobinPlayerStatuses,
    RoundRobinWaitlist,
    calculatePlayerStats,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

export function Players({ tournament }: { tournament: RoundRobin | RoundRobinWaitlist }) {
    if (Object.values(tournament.players).length === 0) {
        return null;
    }

    const isActive = isRoundRobin(tournament);

    const players = isActive
        ? tournament.playerOrder.map((username) => tournament.players[username])
        : Object.values(tournament.players);

    const stats = isActive ? calculatePlayerStats(tournament) : undefined;

    players.sort((lhs, rhs) => {
        if (!stats) {
            return 0;
        }
        return (stats[rhs.username]?.score ?? 0) - (stats[lhs.username]?.score ?? 0);
    });

    return (
        <Table sx={{ mt: 3 }}>
            <TableHead>
                <TableRow>
                    <TableCell>
                        <Typography fontWeight='bold'>Player</Typography>
                    </TableCell>
                    <TableCell align='center'>
                        <Typography fontWeight='bold'>Lichess Username</Typography>
                    </TableCell>
                    <TableCell align='center'>
                        <Typography fontWeight='bold'>Chess.com Username</Typography>
                    </TableCell>
                    <TableCell align='center'>
                        <Typography fontWeight='bold'>Discord Username</Typography>
                    </TableCell>
                    {isActive && (
                        <TableCell align='center'>
                            <Typography fontWeight='bold'>Score</Typography>
                        </TableCell>
                    )}
                </TableRow>
            </TableHead>
            <TableBody>
                {players.map((player) => (
                    <TableRow key={player.username}>
                        <TableCell>
                            <Typography>
                                <Link href={`/profile/${player.username}`}>
                                    {player.displayName}
                                </Link>
                                {player.status === RoundRobinPlayerStatuses.WITHDRAWN &&
                                    ' (Withdrawn)'}
                            </Typography>
                        </TableCell>
                        <TableCell align='center'>
                            <Typography>{player.lichessUsername}</Typography>
                        </TableCell>
                        <TableCell align='center'>
                            <Typography>{player.chesscomUsername}</Typography>
                        </TableCell>
                        <TableCell align='center'>
                            <Typography>{player.discordUsername}</Typography>
                        </TableCell>
                        {stats && (
                            <TableCell align='center'>
                                <Typography>
                                    {stats[player.username]?.score ?? 0}
                                </Typography>
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function isRoundRobin(value: unknown): value is RoundRobin {
    return typeof value === 'object' && value !== null && 'playerOrder' in value;
}
