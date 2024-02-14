import { Block } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
} from '@mui/material';
import {
    DataGridPro,
    GridActionsCellItem,
    GridColDef,
    GridValueFormatterParams,
} from '@mui/x-data-grid-pro';
import { useMemo, useState } from 'react';

import { useApi } from '../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../api/Request';
import { OpenClassical, OpenClassicalPlayer } from '../../../database/tournament';

export const defaultPlayerColumns: GridColDef<OpenClassicalPlayer>[] = [
    {
        field: 'lichessUsername',
        headerName: 'Lichess Username',
        flex: 1,
    },
    {
        field: 'discordUsername',
        headerName: 'Discord Username',
        flex: 1,
    },
    {
        field: 'rating',
        headerName: 'Rating',
    },
    {
        field: 'byeRequests',
        headerName: 'Bye Requests',
        valueFormatter(params: GridValueFormatterParams<boolean[]>) {
            if (!params.value) {
                return null;
            }

            return params.value
                .map((v, idx) => (v ? idx + 1 : false))
                .filter((v) => v !== false)
                .join(', ');
        },
        sortable: false,
        width: 150,
    },
    {
        field: 'status',
        headerName: 'Status',
        valueFormatter(params: GridValueFormatterParams<string>) {
            if (params.value === '') {
                return 'Active';
            }
            if (params.value === 'BANNED') {
                return 'Banned';
            }
            if (params.value === 'WITHDRAWN') {
                return 'Withdrawn';
            }
        },
    },
];

interface PlayersTabProps {
    openClassical: OpenClassical;
    onUpdate: (openClassical: OpenClassical) => void;
}

const PlayersTab: React.FC<PlayersTabProps> = ({ openClassical, onUpdate }) => {
    const [region, setRegion] = useState('A');
    const [ratingRange, setRatingRange] = useState('Open');
    const [banPlayer, setBanPlayer] = useState('');

    const api = useApi();
    const banRequest = useRequest();

    const players = useMemo(
        () =>
            Object.values(
                openClassical.sections[`${region}_${ratingRange}`]?.players || {},
            ),
        [openClassical, region, ratingRange],
    );

    const columns = useMemo(() => {
        return defaultPlayerColumns.concat({
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            getActions: (params) => [
                <Tooltip title='Ban Player'>
                    <GridActionsCellItem
                        icon={<Block color='error' />}
                        label='Ban Player'
                        onClick={() => setBanPlayer(params.row.lichessUsername)}
                    />
                </Tooltip>,
            ],
        });
    }, [setBanPlayer]);

    const onConfirmBan = () => {
        banRequest.onStart();
        api.adminBanPlayer(banPlayer, region, ratingRange)
            .then((resp) => {
                console.log('adminBanPlayer: ', resp);
                onUpdate(resp.data);
                setBanPlayer('');
                banRequest.onSuccess(`${banPlayer} banned`);
            })
            .catch((err) => {
                console.error('adminBanPlayer: ', err);
                banRequest.onFailure(err);
            });
    };

    return (
        <Stack spacing={3}>
            <Stack direction='row' width={1} spacing={2}>
                <TextField
                    label='Region'
                    select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
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
                    onChange={(e) => setRatingRange(e.target.value)}
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    <MenuItem value='Open'>Open</MenuItem>
                    <MenuItem value='U1800'>U1800</MenuItem>
                </TextField>
            </Stack>

            <DataGridPro
                getRowId={(player) => player.lichessUsername}
                rows={players}
                columns={columns}
                autoHeight
                initialState={{
                    sorting: {
                        sortModel: [{ field: 'lichessUsername', sort: 'asc' }],
                    },
                }}
            />

            <Dialog
                open={Boolean(banPlayer)}
                onClose={banRequest.isLoading() ? undefined : () => setBanPlayer('')}
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle>Ban {banPlayer}?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This player will not be able to participate in future tournaments
                        unless they are unbanned later.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setBanPlayer('')}
                        disabled={banRequest.isLoading()}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        loading={banRequest.isLoading()}
                        onClick={onConfirmBan}
                    >
                        Ban Player
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <RequestSnackbar request={banRequest} showSuccess />
        </Stack>
    );
};

export default PlayersTab;
