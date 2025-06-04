import { LichessExplorerMove, LichessExplorerPosition } from '@/database/explorer';
import {
    Link,
    styled,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableRow,
} from '@mui/material';

const StyledTableCell = styled(TableCell)(() => ({
    color: 'inherit',
}));

export function PerformanceSummary({
    position,
}: {
    position: LichessExplorerPosition | LichessExplorerMove;
}) {
    const totalGames = position.white + position.black + position.draws;
    const wins = position.playerWins ?? 0;
    const draws = position.playerDraws ?? 0;
    const losses = position.playerLosses ?? 0;
    const score = wins + draws / 2;
    const percentage = totalGames > 0 ? Math.round((score / totalGames) * 1000) / 10 : undefined;
    return (
        <TableContainer
            sx={{
                border: '1px solid var(--mui-palette-TableCell-border)',
                borderRadius: 1,
            }}
        >
            <Table size='small'>
                <TableBody>
                    <TableRow>
                        <StyledTableCell>Performance Rating (Normalized)</StyledTableCell>
                        <StyledTableCell>{position.performanceRating ?? '-'}</StyledTableCell>
                    </TableRow>
                    <TableRow>
                        <StyledTableCell>Avg Opponent Rating (Normalized)</StyledTableCell>
                        <StyledTableCell>{position.averageOpponentRating ?? '-'}</StyledTableCell>
                    </TableRow>
                    <TableRow>
                        <StyledTableCell>Total Games</StyledTableCell>
                        <StyledTableCell>{totalGames}</StyledTableCell>
                    </TableRow>
                    <TableRow>
                        <StyledTableCell>Results</StyledTableCell>
                        <StyledTableCell>
                            +{wins} -{losses} ={draws}
                        </StyledTableCell>
                    </TableRow>
                    <TableRow>
                        <StyledTableCell>Score</StyledTableCell>
                        <StyledTableCell>
                            {score} / {totalGames}{' '}
                            {percentage !== undefined && <>({percentage}%)</>}
                        </StyledTableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <StyledTableCell colSpan={2} sx={{ borderBottom: 0 }}>
                            Performance rating calculated using{' '}
                            <Link href='https://handbook.fide.com/chapter/B022017' target='_blank'>
                                FIDE regulations
                            </Link>
                        </StyledTableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
}
