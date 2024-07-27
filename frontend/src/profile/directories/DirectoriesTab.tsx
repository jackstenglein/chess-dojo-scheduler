import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { useRequiredAuth } from '@/auth/Auth';
import { User } from '@/database/user';
import { useSearchParams } from '@/hooks/useSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import type { DirectoryItemType } from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Folder } from '@mui/icons-material';
import { Stack } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import { useEffect, useMemo } from 'react';
import { DirectoryBreadcrumbs, useBreadcrumbs } from './DirectoryBreadcrumbs';
import { NewDirectoryButton } from './NewDirectoryButton';

export const DirectoriesTab = ({ user }: { user: User }) => {
    const { user: viewer } = useRequiredAuth();
    const api = useApi();
    const request = useRequest<Directory>();
    const { searchParams, updateSearchParams } = useSearchParams({ directory: 'home' });
    const directoryId = searchParams.get('directory') || 'home';
    const breadcrumbs = useBreadcrumbs();

    const reset = request.reset;
    useEffect(() => {
        if (directoryId) {
            reset();
        }
    }, [reset, directoryId]);

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getDirectory(user.username, directoryId)
                .then((resp) => {
                    console.log('getDirectory: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error('getDirectory: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, directoryId, user, api]);

    const rows = useMemo(() => {
        return Object.values(request.data?.items || {});
    }, [request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (!request.data) {
        return <NotFoundPage />;
    }

    const onClickRow = (params: GridRowParams<DirectoryItem>) => {
        if (params.row.type === DirectoryItemTypes.DIRECTORY) {
            updateSearchParams({ directory: params.row.id });
        }
    };

    return (
        <Stack spacing={2} alignItems='start'>
            {viewer.username === user.username && (
                <NewDirectoryButton
                    parent={request.data.id}
                    onSuccess={request.onSuccess}
                />
            )}

            <DirectoryBreadcrumbs directory={request.data} breadcrumbs={breadcrumbs} />

            <DataGridPro
                rows={rows}
                columns={columns}
                onRowClick={onClickRow}
                autoHeight
                loading={request.isLoading()}
                sx={{ width: 1 }}
            />
        </Stack>
    );
};

const columns: GridColDef<DirectoryItem>[] = [
    {
        field: 'type',
        headerName: '',
        renderCell(params: GridRenderCellParams<DirectoryItem, DirectoryItemType>) {
            switch (params.value) {
                case DirectoryItemTypes.DIRECTORY:
                    return <Folder sx={{ height: 1 }} />;
            }
            return null;
        },
        align: 'center',
        width: 25,
        disableColumnMenu: true,
        resizable: false,
    },
    {
        field: 'name',
        headerName: 'Name',
        valueGetter: (_value, row) => {
            switch (row.type) {
                case DirectoryItemTypes.DIRECTORY:
                    return row.metadata.name;
            }
            return '';
        },
    },
    {
        field: 'createdAt',
        headerName: 'Date Created',
        valueGetter: (_value, row) => row.metadata.createdAt,
    },
];
