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
                        <TableCell>White</TableCell>
                        <TableCell>Black</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tournament.pairings?.[selectedRound - 1] ? (
                        tournament.pairings[selectedRound - 1].map((pair, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Typography textAlign={'center'}>
                                        {tournament.players[pair.white].displayName}
                                    </Typography>
                                    <Typography textAlign={'center'}>
                                        {tournament.players[pair.black].displayName}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2}>
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
