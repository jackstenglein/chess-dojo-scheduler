import NotFoundPage from '@/NotFoundPage';
import { useRequiredAuth } from '@/auth/Auth';
import { User } from '@/database/user';
import { useSearchParams } from '@/hooks/useSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import type { DirectoryItemType } from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
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
import { useMemo, useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { DirectoryBreadcrumbs, useBreadcrumbs } from './DirectoryBreadcrumbs';
import { useDirectory } from './DirectoryCache';
import { NewDirectoryButton } from './NewDirectoryButton';

export const DirectoriesTab = ({ user }: { user: User }) => {
    const { user: viewer } = useRequiredAuth();
    const { searchParams, updateSearchParams } = useSearchParams({ directory: 'home' });
    const directoryId = searchParams.get('directory') || 'home';
    const breadcrumbs = useBreadcrumbs();

    const [selectedRowId, setSelectedRowId] = useState('');
    const [contextMenuPosition, setContextMenuPosition] = useState<{
        mouseX: number;
        mouseY: number;
    }>();

    const { directory, request, putDirectory } = useDirectory(user.username, directoryId);

    const rows = useMemo(() => {
        return Object.values(directory?.items || {});
    }, [directory]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (!directory) {
        return <NotFoundPage />;
    }

    const onClickRow = (params: GridRowParams<DirectoryItem>) => {
        if (params.row.type === DirectoryItemTypes.DIRECTORY) {
            updateSearchParams({ directory: params.row.id });
        }
    };

    const openContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
        setSelectedRowId(event.currentTarget.getAttribute('data-id') || '');
        setContextMenuPosition(
            contextMenuPosition
                ? undefined
                : { mouseX: event.clientX - 2, mouseY: event.clientY - 4 },
        );
    };

    const closeContextMenu = () => {
        setSelectedRowId('');
        setContextMenuPosition(undefined);
    };

    return (
        <Stack spacing={2} alignItems='start'>
            {viewer.username === user.username && (
                <NewDirectoryButton parent={directory.id} onSuccess={putDirectory} />
            )}

            <DirectoryBreadcrumbs directory={directory} breadcrumbs={breadcrumbs} />

            <DataGridPro
                rows={rows}
                columns={columns}
                onRowClick={onClickRow}
                autoHeight
                loading={request.isLoading()}
                sx={{ width: 1 }}
                slotProps={{
                    row: {
                        onContextMenu: openContextMenu,
                    },
                }}
            />

            <ContextMenu
                selectedItem={directory.items[selectedRowId]}
                onClose={closeContextMenu}
                position={contextMenuPosition}
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
        flex: 1,
    },
    {
        field: 'createdAt',
        headerName: 'Date Created',
        valueGetter: (_value, row) => row.metadata.createdAt,
        flex: 1,
    },
];
