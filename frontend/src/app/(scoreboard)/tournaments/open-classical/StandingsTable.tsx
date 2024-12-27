import { OpenClassical, OpenClassicalPlayerStatus } from '@/database/tournament';
import { Stack, Tooltip, Typography } from '@mui/material';
import { DataGridPro, GridColDef } from '@mui/x-data-grid-pro';
import { useMemo } from 'react';
import {Box} from '@mui/material';
import { SiLichess, SiDiscord } from 'react-icons/si';
enum Result {
    Win = 'W',
    ForfeitWin = 'Wf',
    Loss = 'L',
    ForfeitLoss = 'Lf',
    Draw = 'D',
    DidNotPlay = 'X',
    DidNotSubmit = 'F',
    Bye = 'Bye',
    Unknown = '',
}

const NUM_ROUNDS = 7;

const Bye = (
    <Stack height={1} alignItems='center' justifyContent='center'>
        <Tooltip title='Player receieved a bye for 0.5 points'>
            <Typography>Bye</Typography>
        </Tooltip>
    </Stack>
);

function getRoundColumns(rounds: number): GridColDef<StandingsTableRow>[] {
    const result: GridColDef<StandingsTableRow>[] = [];

    for (let i = 0; i < rounds; i++) {
        result.push({
            field: `rounds${i}`,
            headerName: `Round ${i + 1}`,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (_value, row, _column, api) => {
                const round = row.rounds[i];
                if (!round || round.result === Result.Bye) {
                    return Result.Bye;
                }

                const result = round.result;
                const opponent = api.current.getAllRowIds().indexOf(round.opponent) + 1;
                return `${result}${opponent}`;
            },
            renderCell: (params) => {
                const round = params.row.rounds[i];
                if (!round) {
                    if (
                        params.row.lastActiveRound === 0 ||
                        params.row.lastActiveRound >= i + 1
                    ) {
                        return Bye;
                    }
                    return (
                        <Stack height={1} alignItems='center' justifyContent='center'>
                            <Tooltip title='Player was withdrawn'>
                                <Typography>-</Typography>
                            </Tooltip>
                        </Stack>
                    );
                }
                if (round.result === Result.Bye) {
                    return Bye;
                }
                if (round.result === Result.Unknown) {
                    return '';
                }

                const result = round.result;
                const opponent = params.api.getAllRowIds().indexOf(round.opponent) + 1;

                return (
                    <Stack height={1} alignItems='center' justifyContent='center'>
                        <Tooltip title={getResultDescription(result, opponent)}>
                            <Typography>
                                {result}
                                {opponent}
                            </Typography>
                        </Tooltip>
                    </Stack>
                );
            },
        });
    }

    return result;
}

function getResultDescription(result: Result, opponent: number): string {
    switch (result) {
        case Result.Win:
            return `Win against player ${opponent}`;

        case Result.ForfeitWin:
            return `Win by forfeit against ${opponent}`;

        case Result.Loss:
            return `Loss against player ${opponent}`;

        case Result.ForfeitLoss:
            return `Loss by forfeit against ${opponent}`;

        case Result.Draw:
            return `Draw against player ${opponent}`;

        case Result.Bye:
            return 'Player received a bye for 0.5 points';

        case Result.DidNotPlay:
            return `Game against player ${opponent} was not played and counts as a draw`;

        case Result.DidNotSubmit:
            return `Result for game against player ${opponent} was not submitted and counts as a 0-0 forfeit`;

        case Result.Unknown:
            return '';
    }
}

const standingsTableColumns: GridColDef<StandingsTableRow>[] = [
    {
        field: 'rank',
        headerName: 'Rank',
        renderHeader: () => '',
        valueGetter: (_value, row, _col, api) =>
            api.current.getAllRowIds().indexOf(row.lichessUsername) + 1,
        sortable: false,
        filterable: false,
        align: 'center',
        width: 50,
    },
    {
        field: 'lichessUsername',
        headerName: 'Lichess',
        flex: 1,
    },
    {
        field: 'discordUsername',
        headerName: 'Discord',
        flex: 1,
    },
    {
        field: 'total',
        headerName: 'Total',
        align: 'center',
        headerAlign: 'center',
    },
    ...getRoundColumns(NUM_ROUNDS),
];

interface StandingsTableRow {
    lichessUsername: string;
    discordUsername: string;
    total: number;
    rounds: Record<
        number,
        {
            opponent: string;
            result: Result;
        }
    >;
    status: OpenClassicalPlayerStatus;
    lastActiveRound: number;
}

function getResult(result: string, color: 'w' | 'b'): Result {
    if (result === '' || result === '*') {
        return Result.Unknown;
    }
    if (result === '1-0') {
        return color === 'w' ? Result.Win : Result.Loss;
    }
    if (result === '0-1') {
        return color === 'w' ? Result.Loss : Result.Win;
    }
    if (result === '1/2-1/2') {
        return Result.Draw;
    }
    if (result === '1-0F') {
        return color === 'w' ? Result.ForfeitWin : Result.ForfeitLoss;
    }
    if (result === '0-1F') {
        return color === 'w' ? Result.ForfeitLoss : Result.ForfeitWin;
    }
    if (result === '1/2-1/2F') {
        return Result.DidNotPlay;
    }
    if (result === '0-0') {
        return Result.DidNotSubmit;
    }
    return Result.Unknown;
}

function getScore(result: Result): number {
    switch (result) {
        case Result.Win:
        case Result.ForfeitWin:
            return 1;

        case Result.Draw:
        case Result.Bye:
        case Result.DidNotPlay:
            return 0.5;

        case Result.Unknown:
        case Result.Loss:
        case Result.ForfeitLoss:
        case Result.DidNotSubmit:
            return 0;
    }
}

interface StandingsTableProps {
    openClassical?: OpenClassical;
    region: string;
    ratingRange: string;
}

const StandingsTable: React.FC<StandingsTableProps> = ({
    openClassical,
    region,
    ratingRange,
}) => {
    const rows: StandingsTableRow[] = useMemo(() => {
        if (!openClassical) {
            return [];
        }

        const section = openClassical.sections[`${region}_${ratingRange}`];
        if (!section) {
            return [];
        }

        const players: Record<string, StandingsTableRow> = {};
        Object.values(section.players).forEach((player) => {
            players[player.lichessUsername] = {
                lichessUsername: player.lichessUsername,
                discordUsername: player.discordUsername,
                total: 0,
                rounds: {},
                status: player.status,
                lastActiveRound: player.lastActiveRound,
            };
        });

        section.rounds.forEach((round, idx) => {
            round.pairings.forEach((pairing) => {
                const white = players[pairing.white.lichessUsername];
                if (white) {
                    white.rounds[idx] = {
                        opponent: pairing.result ? pairing.black.lichessUsername : '',
                        result:
                            pairing.black.lichessUsername === 'No Opponent'
                                ? Result.Bye
                                : getResult(pairing.result, 'w'),
                    };
                }

                const black = players[pairing.black.lichessUsername];
                if (black) {
                    black.rounds[idx] = {
                        opponent: pairing.result ? pairing.white.lichessUsername : '',
                        result:
                            pairing.white.lichessUsername === 'No Opponent'
                                ? Result.Bye
                                : getResult(pairing.result, 'b'),
                    };
                }
            });
        });

        const rows = Object.values(players).filter(
            (v) => v.lichessUsername !== 'No Opponent',
        );

        rows.forEach((player) => {
            for (let i = 0; i < section.rounds.length; i++) {
                const round = player.rounds[i];
                if (!round) {
                    if (player.lastActiveRound === 0 || player.lastActiveRound >= i + 1) {
                        // Player received a bye
                        player.total += 0.5;
                    }
                } else {
                    player.total += getScore(round.result);
                }
            }

            for (let i = section.rounds.length; i < NUM_ROUNDS; i++) {
                player.rounds[i] = { opponent: '', result: Result.Unknown };
            }
        });

        return rows.sort((lhs, rhs) => rhs.total - lhs.total);
    }, [openClassical, region, ratingRange]);

    if (!openClassical) {
        return null;
    }

    return (
        <DataGridPro
            getRowId={(player) => player.lichessUsername}
            rows={rows}
            columns={standingsTableColumns}
            autoHeight
        />
    );
};

export default StandingsTable;
