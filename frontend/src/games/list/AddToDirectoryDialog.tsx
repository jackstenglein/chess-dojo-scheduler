import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useRequiredAuth } from '@/auth/Auth';
import { GameInfo } from '@/database/game';
import LoadingPage from '@/loading/LoadingPage';
import { DirectoryBreadcrumbs } from '@/profile/directories/DirectoryBreadcrumbs';
import { useDirectory, useDirectoryCache } from '@/profile/directories/DirectoryCache';
import { MoveListItem } from '@/profile/directories/MoveDialog';
import { HOME_DIRECTORY_ID } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    List,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState } from 'react';

export const AddToDirectoryDialog = ({
    game,
    open,
    onClose,
}: {
    game?: GameInfo;
    open: boolean;
    onClose: () => void;
}) => {
    const { user } = useRequiredAuth();
    const [directoryId, setDirectoryId] = useState(HOME_DIRECTORY_ID);
    const { directory, request: directoryRequest } = useDirectory(
        user.username,
        directoryId,
    );
    const cache = useDirectoryCache();
    const request = useRequest<string>();
    const api = useApi();

    const onNavigate = (id: string) => {
        setDirectoryId(id);
    };

    const alreadyExists = Boolean(directory?.items[`${game?.cohort}/${game?.id}`]);

    const onAdd = () => {
        if (!game || alreadyExists) {
            return;
        }

        request.onStart();
        api.addDirectoryItem({
            id: directoryId,
            game: {
                owner: game.owner,
                ownerDisplayName: game.ownerDisplayName,
                createdAt:
                    game.createdAt ||
                    game.date.replaceAll('.', '-') ||
                    new Date().toISOString(),
                id: game.id,
                cohort: game.cohort,
                white: game.headers.White,
                black: game.headers.Black,
                whiteElo: game.headers.WhiteElo,
                blackElo: game.headers.BlackElo,
                result: game.headers.Result,
            },
        })
            .then((resp) => {
                console.log('addDirectoryItem: ', resp);
                cache.put(resp.data.directory);
                request.onSuccess(`Game added to ${resp.data.directory.name}`);
                onClose();
            })
            .catch((err) => {
                console.error('addDirectoryItem: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <Dialog
                open={open && !!game}
                onClose={request.isLoading() ? undefined : onClose}
                fullWidth
            >
                <DialogTitle>Add Game to {directory?.name ?? 'Folder'}?</DialogTitle>
                <DialogContent>
                    {directory ? (
                        <Stack spacing={1}>
                            <DirectoryBreadcrumbs
                                owner={user.username}
                                id={directoryId}
                                onClick={onNavigate}
                                variant='h6'
                            />

                            <Divider>Current Contents</Divider>

                            <List>
                                {Object.values(directory.items)
                                    .sort((lhs, rhs) => lhs.type.localeCompare(rhs.type))
                                    .map((newItem) => (
                                        <MoveListItem
                                            key={newItem.id}
                                            item={newItem}
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                            </List>
                            {Object.values(directory.items).length === 0 && (
                                <Typography textAlign='center' width={1}>
                                    This folder is empty
                                </Typography>
                            )}
                        </Stack>
                    ) : directoryRequest.isLoading() ? (
                        <LoadingPage />
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button disabled={request.isLoading()} onClick={onClose}>
                        Cancel
                    </Button>
                    <Tooltip
                        title={
                            alreadyExists
                                ? 'This game is already added to this directory'
                                : ''
                        }
                    >
                        <div>
                            <LoadingButton
                                disabled={alreadyExists}
                                loading={request.isLoading()}
                                onClick={onAdd}
                            >
                                Add
                            </LoadingButton>
                        </div>
                    </Tooltip>
                </DialogActions>
            </Dialog>

            <RequestSnackbar request={request} showSuccess />
        </>
    );
};
