import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { useRequiredAuth } from '@/auth/Auth';
import { User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import type { DirectoryItemType } from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
    DirectoryVisibility,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { CreateNewFolder, Folder } from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { DataGridPro, GridColDef, GridRenderCellParams } from '@mui/x-data-grid-pro';
import { useEffect, useMemo } from 'react';

export const DirectoriesTab = ({ user }: { user: User }) => {
    const { user: viewer } = useRequiredAuth();
    const api = useApi();
    const request = useRequest<Directory>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.getDirectory(user.username, 'home')
                .then((resp) => {
                    console.log('getDirectory: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error('getDirectory: ', err);
                    request.onFailure(err);
                });
        }
    });

    const rows = useMemo(() => {
        return Object.values(request.data?.items || {});
    }, [request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    const onCreateFolder = () => {
        api.createDirectory({
            id: '',
            name: 'Test',
            parent: 'home',
            visibility: DirectoryVisibility.PUBLIC,
        })
            .then((resp) => {
                console.log('createDirectory: ', resp);
            })
            .catch((err) => {
                console.error('createDirectory: ', err);
            });
    };

    return (
        <Stack spacing={2} alignItems='start'>
            {viewer.username === user.username && (
                <Button
                    variant='contained'
                    startIcon={<CreateNewFolder />}
                    onClick={onCreateFolder}
                >
                    New Folder
                </Button>
            )}

            <DataGridPro
                rows={rows}
                columns={columns}
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
