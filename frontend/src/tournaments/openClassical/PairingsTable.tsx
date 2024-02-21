import { OpenInNew, Warning } from '@mui/icons-material';
import { Stack, Tooltip } from '@mui/material';
import { DataGridPro, GridColDef } from '@mui/x-data-grid-pro';
import { OpenClassical, OpenClassicalPairing } from '../../database/tournament';

export const pairingTableColumns: GridColDef<OpenClassicalPairing>[] = [
    {
        field: 'whiteLichess',
        headerName: 'White (Lichess)',
        valueGetter: (params) =>
            `${params.row.white.lichessUsername}${
                params.row.white.rating ? ` (${params.row.white.rating})` : ''
            }`,
        flex: 1,
    },
    {
        field: 'whiteDiscord',
        headerName: 'White (Discord)',
        valueGetter: (params) => params.row.white.discordUsername,
        flex: 1,
    },
    {
        field: 'blackLichess',
        headerName: 'Black (Lichess)',
        valueGetter: (params) =>
            `${params.row.black.lichessUsername}${
                params.row.black.rating ? ` (${params.row.black.rating})` : ''
            }`,
        flex: 1,
    },
    {
        field: 'blackDiscord',
        headerName: 'Black (Discord)',
        valueGetter: (params) => params.row.black.discordUsername,
        flex: 1,
    },
    {
        field: 'result',
        headerName: 'Result',
        flex: 0.5,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
            if (params.value === '*') {
                return params.value;
            }
            if (params.row.verified) {
                return params.value;
            }
            return (
                <Stack direction='row' alignItems='center' spacing={1}>
                    <div>{params.value}</div>
                    <Tooltip title='This result has not been verified and may be changed later by the TD'>
                        <Warning color='warning' fontSize='small' />
                    </Tooltip>
                </Stack>
            );
        },
    },
    {
        field: 'gameUrl',
        headerName: 'Game',
        width: 75,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
            if (
                params.value &&
                (params.value.startsWith('https://lichess.org/') ||
                    params.value.startsWith('https://www.chess.com/'))
            ) {
                return (
                    <a target='_blank' rel='noopener noreferrer' href={params.value}>
                        <OpenInNew color='primary' fontSize='small' />
                    </a>
                );
            }
            return null;
        },
    },
];

export interface PairingsTableProps {
    openClassical: OpenClassical;
    region: string;
    ratingRange: string;
    round: number;
}

const PairingsTable: React.FC<PairingsTableProps> = ({
    openClassical,
    region,
    ratingRange,
    round,
}) => {
    const pairings =
        openClassical.sections[`${region}_${ratingRange}`]?.rounds[round - 1]?.pairings ??
        [];

    return (
        <DataGridPro
            columns={pairingTableColumns}
            rows={pairings}
            getRowId={(pairing) =>
                `${pairing.white.lichessUsername}-${pairing.black.lichessUsername}`
            }
            autoHeight
        />
    );
};

export default PairingsTable;
