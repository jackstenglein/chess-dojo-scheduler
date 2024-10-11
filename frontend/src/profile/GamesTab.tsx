import { useApi } from '@/api/Api';
import { RequestSnackbar } from '@/api/Request';
import { useAuth, useFreeTier } from '@/auth/Auth';
import GameTable from '@/components/games/list/GameTable';
import { GameInfo } from '@/database/game';
import { RequirementCategory } from '@/database/requirement';
import { User } from '@/database/user';
import { ListItemContextMenu } from '@/games/list/ListItemContextMenu';
import { useDataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { usePagination } from '@/hooks/usePagination';
import Icon from '@/style/Icon';
import UpsellAlert from '@/upsell/UpsellAlert';
import { Button, Stack } from '@mui/material';
import { GridPaginationModel, GridRowParams } from '@mui/x-data-grid-pro';
import { useCallback } from 'react';

interface GamesTabProps {
    user: User;
}

const GamesTab: React.FC<GamesTabProps> = ({ user }) => {
    const api = useApi();
    const { user: currentUser } = useAuth();
    const isFreeTier = useFreeTier();
    const contextMenu = useDataGridContextMenu();

    const searchByOwner = useCallback(
        (startKey: string) => api.listGamesByOwner(user.username, startKey),
        [api, user.username],
    );

    const pagination = usePagination(searchByOwner, 0, 10);
    const { request, data, pageSize, setPageSize } = pagination;

    const onClickRow = (params: GridRowParams<GameInfo>) => {
        window.location.href = `/games/${params.row.cohort.replaceAll(
            '+',
            '%2B',
        )}/${params.row.id.replaceAll('?', '%3F')}`;
    };

    const onPaginationModelChange = (model: GridPaginationModel) => {
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize);
        }
    };

    const onSubmit = () => {
        window.location.href = '/games/import';
    };

    return (
        <Stack spacing={2} alignItems='start'>
            <RequestSnackbar request={request} />
            {currentUser?.username === user.username && (
                <Button
                    variant='contained'
                    onClick={onSubmit}
                    color='success'
                    startIcon={<Icon name={RequirementCategory.Games} />}
                >
                    Analyze a Game
                </Button>
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
                    onClickRow={onClickRow}
                    contextMenu={contextMenu}
                    defaultVisibility={{
                        publishedAt: false,
                        cohort: false,
                        owner: false,
                        unlisted: currentUser?.username === user.username,
                    }}
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
