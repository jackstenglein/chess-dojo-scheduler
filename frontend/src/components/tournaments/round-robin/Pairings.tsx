import { Link } from '@/components/navigation/Link';
import {
    MAX_ROUND_ROBIN_PLAYERS,
    RoundRobin,
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
    const [selectedRound, setSelectedRound] = useState<number>(1);

    const handleRoundChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSelectedRound(Number(event.target.value));
    };

    return (
        <Stack spacing={2}>
            <TextField
                select
                value={selectedRound}
                onChange={handleRoundChange}
                fullWidth
            >
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
                    {tournament.pairings?.[selectedRound - 1] ? (
                        tournament.pairings[selectedRound - 1].map((pair, index) => (
                            <TableRow key={index}>
                                <TableCell align='center'>
                                    <Typography>
                                        <Link href={`/profile/${pair.white}`}>
                                            {tournament.players[pair.white].displayName}
                                        </Link>
                                    </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                    <Typography>
                                        <Link href={`/profile/${pair.black}`}>
                                            {tournament.players[pair.black].displayName}
                                        </Link>
                                    </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                    <Link href={pair.url}>
                                        <Typography>{pair.result}</Typography>
                                    </Link>
                                </TableCell>
                            </TableRow>
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
