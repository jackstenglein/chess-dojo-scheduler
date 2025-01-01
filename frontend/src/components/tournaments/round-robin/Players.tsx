import { Link } from '@/components/navigation/Link';
import {
    RoundRobin,
    RoundRobinPlayerStatuses,
    RoundRobinWaitlist,
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

    const players = isRoundRobin(tournament)
        ? tournament.playerOrder.map((username) => tournament.players[username])
        : Object.values(tournament.players);

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
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function isRoundRobin(value: unknown): value is RoundRobin {
    return typeof value === 'object' && value !== null && 'playerOrder' in value;
}
