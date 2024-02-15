import { Block, PersonRemove, SaveAlt } from '@mui/icons-material';
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
    GridToolbarContainer,
    GridValueFormatterParams,
} from '@mui/x-data-grid-pro';
import { useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../api/Request';
import {
    OpenClassical,
    OpenClassicalPlayer,
    OpenClassicalPlayerStatus,
} from '../../../database/tournament';

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
            if (params.value === OpenClassicalPlayerStatus.Active) {
                return 'Active';
            }
            if (params.value === OpenClassicalPlayerStatus.Banned) {
                return 'Banned';
            }
            if (params.value === OpenClassicalPlayerStatus.Withdrawn) {
                return 'Withdrawn';
            }
        },
    },
];

function CustomToolbar({ region, ratingRange }: { region: string; ratingRange: string }) {
    const api = useApi();
    const downloadRequest = useRequest();

    const onDownloadRegistrations = () => {
        downloadRequest.onStart();
        api.adminGetRegistrations(region, ratingRange)
            .then((resp) => {
                console.log('adminGetRegistrations: ', resp);
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(resp.data);
                link.download = `${region}_${ratingRange}_Registrations.csv`;
                link.click();
                downloadRequest.onSuccess();
                link.remove();
            })
            .catch((err) => {
                console.error('adminGetRegistrations: ', err);
                downloadRequest.onFailure();
            });
    };

    return (
        <GridToolbarContainer>
            <LoadingButton
                startIcon={<SaveAlt />}
                loading={downloadRequest.isLoading()}
                onClick={onDownloadRegistrations}
            >
                Download Registrations
            </LoadingButton>
        </GridToolbarContainer>
    );
}

interface PlayersTabProps {
    openClassical: OpenClassical;
    onUpdate: (openClassical: OpenClassical) => void;
}

const PlayersTab: React.FC<PlayersTabProps> = ({ openClassical, onUpdate }) => {
    const [searchParams, setSearchParams] = useSearchParams({
        region: 'A',
        ratingRange: 'Open',
    });
    const updateSearchParams = (key: string, value: string) => {
        const updatedParams = new URLSearchParams(searchParams.toString());
        updatedParams.set(key, value);
        setSearchParams(updatedParams);
    };

    const [updatePlayer, setUpdatePlayer] = useState('');
    const [updateType, setUpdateType] = useState<'' | 'ban' | 'withdraw'>('');

    const api = useApi();
    const updateRequest = useRequest();

    const region = searchParams.get('region') || 'A';
    const ratingRange = searchParams.get('ratingRange') || 'Open';
    const players = useMemo(
        () =>
            Object.values(
                openClassical.sections[`${region}_${ratingRange}`]?.players || {},
            ).filter((player) => player.lichessUsername !== 'No Opponent'),
        [openClassical, region, ratingRange],
    );

    const columns = useMemo(() => {
        return defaultPlayerColumns.concat({
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            getActions: (params) => [
                <Tooltip title='Withdraw Player'>
                    <GridActionsCellItem
                        disabled={params.row.status !== OpenClassicalPlayerStatus.Active}
                        icon={<PersonRemove />}
                        label='Withdraw Player'
                        onClick={() => {
                            setUpdatePlayer(params.row.lichessUsername);
                            setUpdateType('withdraw');
                        }}
                    />
                </Tooltip>,
                <Tooltip title='Ban Player'>
                    <GridActionsCellItem
                        disabled={params.row.status === OpenClassicalPlayerStatus.Banned}
                        color='error'
                        icon={<Block />}
                        label='Ban Player'
                        onClick={() => {
                            setUpdatePlayer(params.row.lichessUsername);
                            setUpdateType('ban');
                        }}
                    />
                </Tooltip>,
            ],
        });
    }, [setUpdatePlayer]);

    const onConfirmUpdate = () => {
        updateRequest.onStart();
        const func = updateType === 'ban' ? api.adminBanPlayer : api.adminWithdrawPlayer;

        func(updatePlayer, region, ratingRange)
            .then((resp) => {
                console.log('updatePlayer: ', resp);
                onUpdate(resp.data);
                setUpdatePlayer('');
                updateRequest.onSuccess(
                    `${updatePlayer} ${updateType === 'ban' ? 'banned' : 'withdrawn'}`,
                );
            })
            .catch((err) => {
                console.error('updatePlayer: ', err);
                updateRequest.onFailure(err);
            });
    };

    return (
        <Stack spacing={3}>
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
                slots={{
                    toolbar: CustomToolbar,
                }}
                slotProps={{
                    toolbar: {
                        region,
                        ratingRange,
                    },
                }}
            />

            <Dialog
                open={Boolean(updatePlayer)}
                onClose={
                    updateRequest.isLoading() ? undefined : () => setUpdatePlayer('')
                }
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle>
                    {updateType === 'ban' ? 'Ban' : 'Withdraw'} {updatePlayer}?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {updateType === 'ban'
                            ? 'This player cannot be added back to this tournament and will not be able to participate in future tournaments unless they are unbanned later.'
                            : 'This action cannot be undone.'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setUpdatePlayer('')}
                        disabled={updateRequest.isLoading()}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        loading={updateRequest.isLoading()}
                        onClick={onConfirmUpdate}
                    >
                        {updateType === 'ban' ? 'Ban' : 'Withdraw'} Player
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <RequestSnackbar request={updateRequest} showSuccess />
        </Stack>
    );
};

export default PlayersTab;
