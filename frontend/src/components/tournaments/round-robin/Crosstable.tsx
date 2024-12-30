import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { RoundRobinModel } from '../../../app/(scoreboard)/tournaments/round-robin/roundRobinApi';

/**
 * Renders the crosstable for the given tournament.
 */
export function Crosstable({ tournament }: { tournament: RoundRobinModel }) {
    if (!tournament.crosstabledata && !tournament.players) {
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
                        {tournament.players.map((player, index) => (
                            <TableCell key={index} align='center'>
                                {player}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {tournament.crosstabledata.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            <TableCell align='center'>
                                {tournament.players[rowIndex]}
                            </TableCell>
                            {row.map((result, colIndex) => (
                                <TableCell key={colIndex} align='center'>
                                    {result}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
