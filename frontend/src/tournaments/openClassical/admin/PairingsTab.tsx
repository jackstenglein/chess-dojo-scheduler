import { MenuItem, Stack, TextField } from '@mui/material';
import { DataGridPro } from '@mui/x-data-grid-pro';
import { useSearchParams } from 'react-router-dom';
import { OpenClassical } from '../../../database/tournament';
import { PairingsTableProps, pairingTableColumns } from '../PairingsTable';
import Editor from './Editor';
import EmailPairingsButton from './EmailPairingsButton';

interface PairingsTabProps {
    openClassical: OpenClassical;
    onUpdate: (openClassical: OpenClassical) => void;
}

const PairingsTab: React.FC<PairingsTabProps> = ({ openClassical, onUpdate }) => {
    const [searchParams, setSearchParams] = useSearchParams({
        region: 'A',
        ratingRange: 'Open',
        view: '1',
    });
    const updateSearchParams = (key: string, value: string) => {
        const updatedParams = new URLSearchParams(searchParams.toString());
        updatedParams.set(key, value);
        setSearchParams(updatedParams);
    };

    const region = searchParams.get('region') || 'A';
    const ratingRange = searchParams.get('ratingRange') || 'Open';
    const view = searchParams.get('view') || '1';

    const round =
        openClassical.sections[`${region}_${ratingRange}`]?.rounds[parseInt(view) - 1];

    const maxRound =
        openClassical.sections[`${region}_${ratingRange}`]?.rounds.length ?? 1;

    return (
        <Stack spacing={3}>
            <Stack direction='row' spacing={2}>
                <Editor openClassical={openClassical} onSuccess={onUpdate} />
                <EmailPairingsButton
                    maxRound={maxRound}
                    currentRound={parseInt(view)}
                    emailsSent={round?.pairingEmailsSent}
                    onSuccess={onUpdate}
                />
            </Stack>

            <Stack direction='row' width={1} spacing={2}>
                <TextField
                    label='Region'
                    select
                    value={region}
                    onChange={(e) => updateSearchParams('region', e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <MenuItem value='A'>Region A (Americas)</MenuItem>
                    <MenuItem value='B'>Region B (Eurasia/Africa/Oceania)</MenuItem>
                </TextField>

                <TextField
                    data-cy='section'
                    label='Section'
                    select
                    value={ratingRange}
                    onChange={(e) => updateSearchParams('ratingRange', e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <MenuItem value='Open'>Open</MenuItem>
                    <MenuItem value='U1800'>U1800</MenuItem>
                </TextField>

                <TextField
                    label='Round'
                    select
                    value={view}
                    onChange={(e) => updateSearchParams('view', e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    {Array(maxRound)
                        .fill(0)
                        .map((_, i) => (
                            <MenuItem key={i + 1} value={`${i + 1}`}>
                                Round {i + 1}
                            </MenuItem>
                        ))}
                </TextField>
            </Stack>

            <AdminPairingsTable
                openClassical={openClassical}
                region={region}
                ratingRange={ratingRange}
                round={parseInt(view)}
            />
        </Stack>
    );
};

const adminPairingTableColumns = [
    ...pairingTableColumns,
    {
        field: 'reportOpponent',
        headerName: 'Report Opponent',
        type: 'boolean',
        width: 125,
    },
    {
        field: 'notes',
        headerName: 'Notes',
        flex: 1,
    },
];

const AdminPairingsTable: React.FC<PairingsTableProps> = ({
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
            columns={adminPairingTableColumns}
            rows={pairings}
            getRowId={(pairing) =>
                `${pairing.white.lichessUsername}-${pairing.black.lichessUsername}`
            }
            getRowHeight={() => 'auto'}
            sx={{
                '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': {
                    py: '8px',
                },
                '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': {
                    py: '15px',
                },
                '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': {
                    py: '22px',
                },
            }}
            autoHeight
        />
    );
};

export default PairingsTab;
