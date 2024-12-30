import Circle from '@mui/icons-material/Circle';
import {
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { ChangeEvent, useState } from 'react';
import { RoundRobinModel } from '../../../app/(scoreboard)/tournaments/round-robin/roundRobinApi';

/**
 * Renders the pairings for the given Round Robin tournament.
 * @param tournament The tournament to render the pairings for.
 */
export function Pairings({ tournament }: { tournament: RoundRobinModel }) {
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
                {[...Array(9).keys()].map((round) => (
                    <MenuItem key={round + 1} value={round + 1}>
                        Round {round + 1}
                    </MenuItem>
                ))}
            </TextField>

            <Table>
                <TableBody>
                    {tournament.pairingdata?.[selectedRound - 1] ? (
                        tournament.pairingdata[selectedRound - 1]?.map((pair, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Typography textAlign={'center'}>
                                        {
                                            <Circle
                                                sx={{
                                                    verticalAlign: 'middle',
                                                    marginRight: 3,
                                                    color: 'white',
                                                }}
                                            />
                                        }{' '}
                                        {pair.replaceAll('**', '')}{' '}
                                        {
                                            <Circle
                                                sx={{
                                                    verticalAlign: 'middle',
                                                    marginLeft: 1,
                                                    color: 'grey',
                                                }}
                                            />
                                        }
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
