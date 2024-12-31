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
 * Renders the crosstable for the given tournament.
 */
export function Crosstable({ tournament }: { tournament: RoundRobin }) {
    if (!tournament.players) {
        return (
            <Typography textAlign={'center'}>No crosstable data available.</Typography>
        );
    }

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell align='center'></TableCell>
                        {tournament.playerOrder.map((username) => (
                            <TableCell key={username} align='center'>
                                <Link href={`/profile/${username}`}>
                                    {tournament.players[username].displayName}
                                </Link>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tournament.playerOrder.map((lhs) => (
                        <TableRow key={lhs}>
                            <TableCell align='center'>
                                <Link href={`/profile/${lhs}`}>
                                    {tournament.players[lhs].displayName}
                                </Link>
                            </TableCell>

                            {tournament.playerOrder.map((rhs) => {
                                if (lhs === rhs) {
                                    return (
                                        <TableCell key={`${lhs}-${rhs}`} align='center'>
                                            <Typography variant='h6'>-</Typography>
                                        </TableCell>
                                    );
                                }

                                let pairing: RoundRobinPairing | undefined = undefined;
                                for (const round of tournament.pairings) {
                                    for (const p of round) {
                                        if (
                                            (p.white === lhs && p.black === rhs) ||
                                            (p.black === lhs && p.white === rhs)
                                        ) {
                                            pairing = p;
                                            break;
                                        }
                                    }
                                }

                                let result = '';
                                if (pairing?.result === '1-0') {
                                    result = pairing.white === lhs ? '1' : '0';
                                } else if (pairing?.result === '0-1') {
                                    result = pairing.white === lhs ? '0' : '1';
                                } else if (pairing?.result === '1/2-1/2') {
                                    result = '1/2';
                                }

                                return (
                                    <TableCell key={`${lhs}-${rhs}`} align='center'>
                                        <Typography variant='h6'>
                                            <Link href={pairing?.url}>{result}</Link>
                                        </Typography>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
