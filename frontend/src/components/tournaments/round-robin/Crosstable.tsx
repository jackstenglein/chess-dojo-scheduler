import { Link } from '@/components/navigation/Link';
import { RoundRobin } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
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
                        <TableCell align='center'>Player</TableCell>
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
                    {tournament.playerOrder.map((username) => (
                        <TableRow key={username}>
                            <TableCell align='center'>
                                {tournament.players[username].displayName}
                            </TableCell>
                            {tournament.pairings.map((round, idx) => {
                                const pairing = round.find(
                                    (p) => p.white === username || p.black === username,
                                );
                                let result = '';
                                if (pairing?.result === '1-0') {
                                    result = pairing.white === username ? '1' : '0';
                                } else if (pairing?.result === '0-1') {
                                    result = pairing.white === username ? '0' : '1';
                                } else if (pairing?.result === '1/2-1/2') {
                                    result = '1/2';
                                }

                                return (
                                    <TableCell key={idx} align='center'>
                                        {result}
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
