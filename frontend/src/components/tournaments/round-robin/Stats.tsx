import {
    Box,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts';
import { useState } from 'react';
import { RoundRobinModel } from '../../../app/(scoreboard)/tournaments/round-robin/roundRobinApi';

/**
 * Renders the stats for the given Round Robin tournament.
 * @param tournament The tournament to render the stats for.
 */
export function Stats({ tournament }: { tournament: RoundRobinModel }) {
    const [viewMode, setViewMode] = useState<'count' | 'percentage'>('count');
    const [displayMode, setDisplayMode] = useState<'graph' | 'list'>('graph');

    return (
        <Stack spacing={3}>
            <Stack>
                <Typography variant='subtitle1'>
                    Time Elapsed: {calculateElapsedTime(tournament.startdate)}
                </Typography>
                <Typography variant='subtitle1'>
                    Time Remaining: {calculateRemainingTime(tournament.enddate)}
                </Typography>
                <Typography variant='subtitle1'>
                    Game Completion:{' '}
                    {calculateGameCompletion(tournament.players, tournament.gameSub)}%
                </Typography>
            </Stack>

            <Stack direction='row' gap={2}>
                <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={(_e, newViewMode: 'count' | 'percentage' | null) =>
                        newViewMode && setViewMode(newViewMode)
                    }
                    size='small'
                    aria-label='view mode toggle'
                >
                    <ToggleButton value='count'>Count</ToggleButton>
                    <ToggleButton value='percentage'>Percentage</ToggleButton>
                </ToggleButtonGroup>

                <ToggleButtonGroup
                    value={displayMode}
                    exclusive
                    size='small'
                    onChange={(_e, newDisplayMode: 'graph' | 'list' | null) =>
                        newDisplayMode && setDisplayMode(newDisplayMode)
                    }
                    aria-label='display mode toggle'
                >
                    <ToggleButton value='graph'>Graph</ToggleButton>
                    <ToggleButton value='list'>List</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Box>
                {displayMode === 'graph' ? (
                    <GraphView
                        players={tournament.players}
                        crosstable={tournament.crosstabledata}
                        viewMode={viewMode}
                    />
                ) : (
                    <ListView
                        players={tournament.players}
                        crosstable={tournament.crosstabledata}
                        viewMode={viewMode}
                    />
                )}
            </Box>
        </Stack>
    );
}

/**
 * Returns a string representation of the time elapsed since the given date.
 * @param start The date to start from.
 */
function calculateElapsedTime(start: string) {
    const elapsed = new Date().getTime() - new Date(start).getTime();
    return formatTime(elapsed);
}

/**
 * Returns a string representation of the time remaining until the given date.
 * @param end The date to end at.
 */
function calculateRemainingTime(end: string) {
    return formatTime(new Date(end).getTime() - new Date().getTime());
}

/**
 * Returns a string representation of the given number of milliseconds.
 * If the value is greater than an hour, only hours and days are included in the output.
 * @param milliseconds The number of milliseconds to convert.
 * @returns A string representation of milliseconds.
 */
function formatTime(milliseconds: number): string {
    let value = '';

    if (milliseconds > 8.64e7) {
        const days = Math.floor(milliseconds / 8.64e7);
        milliseconds = milliseconds % 8.64e7;
        value += `${days} day${days !== 1 ? 's' : ''}, `;
    }

    if (milliseconds > 3.6e6) {
        const hours = Math.floor(milliseconds / 3.6e6);
        milliseconds = milliseconds % 3.6e6;
        value += `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    if (value.length === 0 && milliseconds > 60000) {
        const minutes = Math.floor(milliseconds / 60000);
        value += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    if (value.length === 0) {
        return 'less than a minute';
    }

    return value.replace(/, $/, '');
}

/**
 * Returns the game completion as a percentage.
 * @param players The players in the tournament.
 * @param games The games in the tournament.
 */
function calculateGameCompletion(players: string[], games: string[]) {
    return roundval(games.length, (players.length * (players.length - 1)) / 2);
}

const roundval = (start: number, end: number) => {
    return Math.min((start / end) * 100, 100).toFixed(2);
};

/**
 * Renders the player's W/D/L counts as a bar graph.
 * @param players The players to include in the table.
 * @param crosstable The crosstable data to calculate W/D/L counts from.
 * @param viewMode Whether to display counts or percentages.
 */
function GraphView({
    players,
    crosstable,
    viewMode,
}: {
    players: string[];
    crosstable: string[][];
    viewMode: 'count' | 'percentage';
}) {
    const playerStats = calculatePlayerStats(players, crosstable);
    const playerNames = playerStats.map((stat) => stat.player);
    const totalGames = players.length - 1;

    const wins =
        viewMode === 'count'
            ? playerStats.map((stat) => stat.wins)
            : playerStats.map((stat) => +((stat.wins / totalGames) * 100).toFixed(2));
    const losses =
        viewMode === 'count'
            ? playerStats.map((stat) => stat.losses)
            : playerStats.map((stat) => +((stat.losses / totalGames) * 100).toFixed(2));
    const draws =
        viewMode === 'count'
            ? playerStats.map((stat) => stat.draws)
            : playerStats.map((stat) => +((stat.draws / totalGames) * 100).toFixed(2));

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 400,
            }}
        >
            <BarChart
                xAxis={[{ data: playerNames, scaleType: 'band' }]}
                series={[
                    { data: wins, label: viewMode === 'count' ? 'Wins' : 'Win %' },
                    { data: draws, label: viewMode === 'count' ? 'Draws' : 'Draw %' },
                    {
                        data: losses,
                        label: viewMode === 'count' ? 'Losses' : 'Loss %',
                    },
                ]}
                width={1100}
                height={400}
            />
        </Box>
    );
}

/**
 * Renders the players' W/D/L counts as a table.
 * @param players The players to include in the table.
 * @param crosstable The crosstable data to calculate W/D/L counts from.
 * @param viewMode Whether to display counts or percentages.
 */
function ListView({
    players,
    crosstable,
    viewMode,
}: {
    players: string[];
    crosstable: string[][];
    viewMode: 'count' | 'percentage';
}) {
    const playerStats = calculatePlayerStats(players, crosstable);
    const totalGames = players.length - 1;

    return (
        <TableContainer>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Player</TableCell>
                        <TableCell>{viewMode === 'count' ? 'Wins' : 'Win %'}</TableCell>
                        <TableCell>{viewMode === 'count' ? 'Draws' : 'Draw %'}</TableCell>
                        <TableCell>
                            {viewMode === 'count' ? 'Losses' : 'Loss %'}
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {playerStats.map((stat, idx) => (
                        <TableRow key={idx}>
                            <TableCell>{stat.player}</TableCell>
                            <TableCell>
                                {viewMode === 'count'
                                    ? stat.wins
                                    : ((stat.wins / totalGames) * 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                                {viewMode === 'count'
                                    ? stat.draws
                                    : ((stat.draws / totalGames) * 100).toFixed(2)}
                            </TableCell>
                            <TableCell>
                                {viewMode === 'count'
                                    ? stat.losses
                                    : ((stat.losses / totalGames) * 100).toFixed(2)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

/**
 * Calculates the W/D/L counts for the given players and crosstable.
 * @param players The players to calculate the counts for.
 * @param crosstable The crosstable to calculate the counts for.
 * @returns A list of W/D/L counts for each player.
 */
function calculatePlayerStats(players: string[], crosstable: string[][]) {
    return players.map((player, index) => {
        let wins = 0,
            losses = 0,
            draws = 0;
        crosstable[index]?.forEach((result) => {
            if (result === '1') wins++;
            else if (result === '0') losses++;
            else if (result === '1/2') draws++;
        });
        return { player, wins, losses, draws };
    });
}
