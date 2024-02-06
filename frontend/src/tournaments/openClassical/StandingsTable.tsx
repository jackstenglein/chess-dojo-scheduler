import { useMemo } from 'react';
import { Tooltip, Typography } from '@mui/material';
import { DataGridPro, GridColDef } from '@mui/x-data-grid-pro';

import { OpenClassical } from '../../database/tournament';

const NUM_ROUNDS = 7;

function getRoundColumns(rounds: number): GridColDef<StandingsTableRow>[] {
    const result: GridColDef<StandingsTableRow>[] = [];

    for (let i = 0; i < rounds; i++) {
        result.push({
            field: `rounds${i}`,
            headerName: `Round ${i + 1}`,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (params) => {
                const round = params.row.rounds[i];
                if (!round || round.result === 'Bye') {
                    return 'Bye';
                }

                const result = round.result;
                const opponent = params.api.getAllRowIds().indexOf(round.opponent) + 1;
                return `${result}${opponent}`;
            },
            renderCell: (params) => {
                const round = params.row.rounds[i];
                if (!round || round.result === 'Bye') {
                    return (
                        <Tooltip title='Player receieved a bye for 0.5 points'>
                            <Typography>Bye</Typography>
                        </Tooltip>
                    );
                }
                if (round.result === '') {
                    return '';
                }

                const result = round.result;
                const opponent = params.api.getAllRowIds().indexOf(round.opponent) + 1;

                return (
                    <Tooltip title={getResultDescription(result, opponent)}>
                        <Typography>
                            {result}
                            {opponent}
                        </Typography>
                    </Tooltip>
                );
            },
        });
    }

    return result;
}

function getResultDescription(result: Result, opponent: number): string {
    if (result === 'W') {
        return `Win against player ${opponent}`;
    }
    if (result === 'L') {
        return `Loss against player ${opponent}`;
    }
    if (result === 'D') {
        return `Draw against player ${opponent}`;
    }
    if (result === 'X') {
        return `Game against player ${opponent} was not played`;
    }
    return '';
}

const standingsTableColumns: GridColDef<StandingsTableRow>[] = [
    {
        field: 'rank',
        headerName: 'Rank',
        renderHeader: () => '',
        valueGetter: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
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

type Result = 'W' | 'L' | 'D' | 'X' | 'Bye' | '';

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
}

function getResult(result: string, color: 'w' | 'b'): Result {
    if (result === '' || result === '*') {
        return '';
    }
    if (result === '1-0') {
        return color === 'w' ? 'W' : 'L';
    }
    if (result === '0-1') {
        return color === 'w' ? 'L' : 'W';
    }
    if (result === '1/2-1/2') {
        return 'D';
    }
    return 'X';
}

function getScore(result: Result): number {
    if (result === 'W') {
        return 1;
    }
    if (result === 'D' || result === 'Bye') {
        return 0.5;
    }
    return 0;
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
                                ? 'Bye'
                                : getResult(pairing.result, 'w'),
                    };
                }

                const black = players[pairing.black.lichessUsername];
                if (black) {
                    black.rounds[idx] = {
                        opponent: pairing.result ? pairing.white.lichessUsername : '',
                        result:
                            pairing.white.lichessUsername === 'No Opponent'
                                ? 'Bye'
                                : getResult(pairing.result, 'b'),
                    };
                }
            });
        });

        const rows = Object.values(players).filter(
            (v) => v.lichessUsername !== 'No Opponent'
        );

        rows.forEach((player) => {
            for (let i = 0; i < section.rounds.length; i++) {
                const round = player.rounds[i];
                if (!round) {
                    // Player received a bye
                    player.total += 0.5;
                } else {
                    player.total += getScore(round.result);
                }
            }

            for (let i = section.rounds.length; i < NUM_ROUNDS; i++) {
                player.rounds[i] = { opponent: '', result: '' };
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
