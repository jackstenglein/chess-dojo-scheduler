import { GameData, PerformanceData } from '@/database/explorer';
import { GameResult } from '@/database/game';
import { OpenInNew } from '@mui/icons-material';
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
import { Color } from './PlayerSource';

const StyledTableCell = styled(TableCell)(() => ({
    color: 'inherit',
}));

export function PerformanceSummary({ data }: { data?: PerformanceData }) {
    if (!data) {
        return null;
    }

    const totalGames = data.playerWins + data.playerLosses + data.playerDraws;
    const wins = data.playerWins;
    const draws = data.playerDraws;
    const losses = data.playerLosses;
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
                        <StyledTableCell>{data.performanceRating}</StyledTableCell>
                    </TableRow>
                    <TableRow>
                        <StyledTableCell>Avg Opponent Rating (Normalized)</StyledTableCell>
                        <StyledTableCell>{data.averageOpponentRating}</StyledTableCell>
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
                    <TableRow>
                        <StyledTableCell>Last Played</StyledTableCell>
                        <GameMetadata game={data.lastPlayed} showResult showRating />
                    </TableRow>
                    {data.bestWin && (
                        <TableRow>
                            <StyledTableCell>Best Win</StyledTableCell>
                            <GameMetadata game={data.bestWin} showRating />
                        </TableRow>
                    )}
                    {data.worstLoss && (
                        <TableRow>
                            <StyledTableCell>Worst Loss</StyledTableCell>
                            <GameMetadata game={data.worstLoss} showRating />
                        </TableRow>
                    )}
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

function GameMetadata({
    game,
    showResult,
    showRating,
}: {
    game: GameData;
    showResult?: boolean;
    showRating?: boolean;
}) {
    const result =
        game.result === GameResult.Draw
            ? 'Draw'
            : (game.result === GameResult.White) === (game.playerColor === Color.White)
              ? 'Win'
              : 'Loss';

    let description = showResult ? result : '';
    if (showRating) {
        if (description) {
            description += ' ';
        }
        description += 'vs ';
        description +=
            game.playerColor === Color.White
                ? `${game.normalizedBlackElo}`
                : `${game.normalizedWhiteElo}`;
    }

    return (
        <StyledTableCell>
            {game.headers.Date} {description && <>({description})</>}{' '}
            <Link href={game.url} target='_blank'>
                <OpenInNew fontSize='inherit' sx={{ verticalAlign: 'middle' }} />
            </Link>
        </StyledTableCell>
    );
}
