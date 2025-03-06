import { Link } from '@/components/navigation/Link';
import {
    RoundRobin,
    RoundRobinPlayerStatuses,
    RoundRobinWaitlist,
    calculatePlayerStats,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { EmojiEvents } from '@mui/icons-material';
import {
    Chip,
    Stack,
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

    const isTournament = isRoundRobin(tournament);

    const players = isTournament
        ? tournament.playerOrder.map((username) => tournament.players[username])
        : Object.values(tournament.players);

    const stats = isTournament ? calculatePlayerStats(tournament) : undefined;

    players.sort((lhs, rhs) => {
        if (!stats) {
            return 0;
        }
        return (
            (stats[rhs.username]?.score ?? 0) - (stats[lhs.username]?.score ?? 0) ||
            (stats[rhs.username]?.tiebreakScore ?? 0) -
                (stats[lhs.username]?.tiebreakScore ?? 0)
        );
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
                    {isTournament && (
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
                            <Stack direction='row' alignItems='center' gap={1}>
                                {isTournament &&
                                    tournament.winners?.includes(player.username) && (
                                        <Chip
                                            color='success'
                                            size='small'
                                            icon={<EmojiEvents />}
                                            sx={{ '& .MuiChip-label': { pr: 0 } }}
                                        />
                                    )}

                                <Typography>
                                    <Link href={`/profile/${player.username}`}>
                                        {player.displayName}
                                    </Link>
                                    {player.status ===
                                        RoundRobinPlayerStatuses.WITHDRAWN &&
                                        ' (Withdrawn)'}
                                </Typography>
                            </Stack>
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
