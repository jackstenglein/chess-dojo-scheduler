import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { OpenClassical } from '@/database/tournament';
import { Check } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { DataGridPro, GridActionsCellItem } from '@mui/x-data-grid-pro';
import { useMemo, useState } from 'react';
import { defaultPlayerColumns } from './PlayersTab';

interface BannedPlayersTabProps {
    openClassical: OpenClassical;
    onUpdate: (openClassical: OpenClassical) => void;
}

const BannedPlayersTab: React.FC<BannedPlayersTabProps> = ({ openClassical, onUpdate }) => {
    const [unbanPlayer, setUnbanPlayer] = useState('');
    const api = useApi();
    const unbanRequest = useRequest<string>();

    const columns = useMemo(() => {
        return defaultPlayerColumns.slice(0, 3).concat({
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            getActions: (params) => [
                <Tooltip key='unban-player' title='Unban Player'>
                    <GridActionsCellItem
                        icon={<Check color='success' />}
                        label='Unban Player'
                        onClick={() => setUnbanPlayer(params.row.lichessUsername)}
                    />
                </Tooltip>,
            ],
        });
    }, []);

    const players = useMemo(() => Object.values(openClassical.bannedPlayers), [openClassical]);

    const onConfirmUnban = () => {
        unbanRequest.onStart();
        api.adminUnbanPlayer(unbanPlayer)
            .then((resp) => {
                onUpdate(resp.data);
                setUnbanPlayer('');
                unbanRequest.onSuccess(`${unbanPlayer} unbanned`);
            })
            .catch((err) => {
                console.error('adminUnbanPlayer: ', err);
                unbanRequest.onFailure(err);
            });
    };

    return (
        <Stack spacing={3}>
            <Typography>
                Banned players are prevented from playing in any section of the Open Classical.
            </Typography>

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
                open={Boolean(unbanPlayer)}
                onClose={unbanRequest.isLoading() ? undefined : () => setUnbanPlayer('')}
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle>Unban {unbanPlayer}?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        This will allow the player to register and participate in future open
                        classicals.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUnbanPlayer('')} disabled={unbanRequest.isLoading()}>
                        Cancel
                    </Button>
                    <LoadingButton loading={unbanRequest.isLoading()} onClick={onConfirmUnban}>
                        Unban Player
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <RequestSnackbar request={unbanRequest} showSuccess />
        </Stack>
    );
};

export default BannedPlayersTab;
