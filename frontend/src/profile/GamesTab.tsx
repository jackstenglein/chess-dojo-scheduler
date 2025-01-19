import { useApi } from '@/api/Api';
import { RequestSnackbar } from '@/api/Request';
import { useAuth, useFreeTier } from '@/auth/Auth';
import GameTable from '@/components/games/list/GameTable';
import { GameInfo } from '@/database/game';
import { RequirementCategory } from '@/database/requirement';
import { User } from '@/database/user';
import { BulkGameEditor } from '@/games/list/BulkGameEditor';
import { ListItemContextMenu } from '@/games/list/ListItemContextMenu';
import { useDataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { usePagination } from '@/hooks/usePagination';
import { useRouter } from '@/hooks/useRouter';
import Icon from '@/style/Icon';
import UpsellAlert from '@/upsell/UpsellAlert';
import { Button, Stack } from '@mui/material';
import {
    GridPaginationModel,
    GridRowParams,
    GridRowSelectionModel,
} from '@mui/x-data-grid-pro';
import { useCallback, useState } from 'react';

interface GamesTabProps {
    user: User;
}

const GamesTab: React.FC<GamesTabProps> = ({ user }) => {
    const api = useApi();
    const { user: currentUser } = useAuth();
    const isFreeTier = useFreeTier();
    const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);
    const contextMenu = useDataGridContextMenu();
    const router = useRouter();

    const searchByOwner = useCallback(
        (startKey: string) => api.listGamesByOwner(user.username, startKey),
        [api, user.username],
    );

    const pagination = usePagination(searchByOwner, 0, 10);
    const { request, data, pageSize, setPageSize, onDelete, setGames } = pagination;

    const onClickRow = (params: GridRowParams<GameInfo>, event: React.MouseEvent) => {
        const url = `/games/${params.row.cohort.replaceAll(
            '+',
            '%2B',
        )}/${params.row.id.replaceAll('?', '%3F')}`;

        if (event.shiftKey) {
            window.open(url, '_blank');
        } else {
            router.push(url);
        }
    };

    const onPaginationModelChange = (model: GridPaginationModel) => {
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize);
        }
    };

    const onSubmit = () => {
        router.push('/games/import');
    };

    return (
        <Stack spacing={2} alignItems='start'>
            <RequestSnackbar request={request} />
            {currentUser?.username === user.username && (
                <Stack
                    direction='row'
                    alignItems='center'
                    gap={2}
                    width={1}
                    flexWrap='wrap'
                >
                    <Button
                        variant='contained'
                        onClick={onSubmit}
                        color='success'
                        startIcon={<Icon name={RequirementCategory.Games} />}
                    >
                        Analyze a Game
                    </Button>
                    <BulkGameEditor
                        games={rowSelectionModel
                            .map((id) => data.find((g) => g.id === id))
                            .filter((g) => !!g)}
                        onClear={() => setRowSelectionModel([])}
                        onDelete={onDelete}
                        setGames={setGames}
                    />
                </Stack>
            )}

            {isFreeTier && currentUser?.username !== user.username && (
                <Stack alignItems='center' mb={5}>
                    <UpsellAlert>
                        To avoid unfair preparation against Dojo members, free-tier users
                        cannot view games by a specific player. Upgrade your account to
                        view the full Dojo Database.
                    </UpsellAlert>
                </Stack>
            )}

            {(!isFreeTier || currentUser?.username === user.username) && (
                <GameTable
                    namespace='games-profile-tab'
                    pagination={pagination}
                    onPaginationModelChange={onPaginationModelChange}
                    onRowClick={onClickRow}
                    contextMenu={contextMenu}
                    defaultVisibility={{
                        publishedAt: false,
                        cohort: false,
                        owner: false,
                        unlisted: currentUser?.username === user.username,
                    }}
                    checkboxSelection={currentUser?.username === user.username}
                    checkboxSelectionVisibleOnly
                    onRowSelectionModelChange={setRowSelectionModel}
                    rowSelectionModel={rowSelectionModel}
                />
            )}

            <ListItemContextMenu
                game={
                    contextMenu.rowIds
                        ? data.find((g) => g.id === contextMenu.rowIds[0])
                        : undefined
                }
                onClose={contextMenu.close}
                position={contextMenu.position}
            />
        </Stack>
    );
};

export default GamesTab;
