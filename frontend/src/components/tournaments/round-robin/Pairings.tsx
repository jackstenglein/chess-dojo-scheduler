import { Link } from '@/components/navigation/Link';
import {
    MAX_ROUND_ROBIN_PLAYERS,
    RoundRobin,
    RoundRobinPairing,
    RoundRobinPlayerStatuses,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import {
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { ChangeEvent, useState } from 'react';

/**
 * Renders the pairings for the given Round Robin tournament.
 * @param tournament The tournament to render the pairings for.
 */
export function Pairings({ tournament }: { tournament: RoundRobin }) {
    const [round, setRound] = useState<number>(1);

    const handleRoundChange = (event: ChangeEvent<HTMLInputElement>) => {
        setRound(Number(event.target.value));
    };

    return (
        <Stack spacing={2}>
            <TextField select value={round} onChange={handleRoundChange} fullWidth>
                {[...Array(MAX_ROUND_ROBIN_PLAYERS - 1).keys()].map((round) => (
                    <MenuItem key={round + 1} value={round + 1}>
                        Round {round + 1}
                    </MenuItem>
                ))}
            </TextField>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell align='center'>
                            <Typography fontWeight='bold'>White</Typography>
                        </TableCell>
                        <TableCell align='center'>
                            <Typography fontWeight='bold'>Black</Typography>
                        </TableCell>
                        <TableCell align='center'>
                            <Typography fontWeight='bold'>Result</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tournament.pairings?.[round - 1] ? (
                        tournament.pairings[round - 1].map((pair, index) => (
                            <Pairing key={index} pairing={pair} tournament={tournament} />
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3}>
                                <Typography textAlign={'center'}>
                                    No pairings available for this round.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Stack>
    );
}

function Pairing({
    pairing,
    tournament,
}: {
    pairing: RoundRobinPairing;
    tournament: RoundRobin;
}) {
    const whiteWithdrawn =
        tournament.players[pairing.white].status === RoundRobinPlayerStatuses.WITHDRAWN;
    const blackWithdrawn =
        tournament.players[pairing.black].status === RoundRobinPlayerStatuses.WITHDRAWN;

    const White = (
        <Link href={`/profile/${pairing.white}`}>
            {tournament.players[pairing.white].displayName}
        </Link>
    );

    const Black = (
        <Link href={`/profile/${pairing.black}`}>
            {tournament.players[pairing.black].displayName}
        </Link>
    );

    const result =
        whiteWithdrawn && !blackWithdrawn
            ? '0-1'
            : blackWithdrawn && !whiteWithdrawn
              ? '1-0'
              : whiteWithdrawn && blackWithdrawn
                ? '0-0'
                : pairing.result;

    return (
        <TableRow>
            <TableCell align='center'>
                <Typography>
                    {whiteWithdrawn && 'Bye ('}
                    {White}
                    {whiteWithdrawn && ' withdrew)'}
                </Typography>
            </TableCell>
            <TableCell align='center'>
                <Typography>
                    {blackWithdrawn && 'Bye ('}
                    {Black}
                    {blackWithdrawn && ' withdrew)'}
                </Typography>
            </TableCell>
            <TableCell align='center'>
                <Typography>
                    {pairing.url ? <Link href={pairing.url}>{result}</Link> : result}
                </Typography>
            </TableCell>
        </TableRow>
    );
}
