import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import {
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import { useDirectoryCache } from './DirectoryCache';

export const DeleteDialog = ({
    directory,
    items,
    onCancel,
}: {
    directory: Directory;
    items: DirectoryItem[];
    onCancel: () => void;
}) => {
    const [value, setValue] = useState('');
    const request = useRequest();
    const api = useApi();
    const cache = useDirectoryCache();

    const requiresConfirmation = items.some(
        (item) => item.type === DirectoryItemTypes.DIRECTORY,
    );
    const disableDelete = requiresConfirmation && value.trim() !== 'delete';

    const onDelete = () => {
        if (disableDelete || request.isLoading()) {
            return;
        }

        request.onStart();

        const gameItemIds = items
            .filter((item) => item.type !== DirectoryItemTypes.DIRECTORY)
            .map((item) => item.id);
        const directoryItemIds = items
            .filter((item) => item.type === DirectoryItemTypes.DIRECTORY)
            .map((item) => item.id);

        const promises: Promise<void>[] = [];

        if (gameItemIds.length > 0) {
            promises.push(
                api
                    .removeDirectoryItem({
                        directoryId: directory.id,
                        itemIds: gameItemIds,
                    })
                    .then((resp) => {
                        console.log('removeDirectoryItem: ', resp);
                        cache.put(resp.data.directory);
                        trackEvent(EventType.RemoveDirectoryItems, {
                            count: gameItemIds.length,
                        });
                    }),
            );
        }
        if (directoryItemIds.length > 0) {
            promises.push(
                api.deleteDirectories(directoryItemIds).then((resp) => {
                    console.log('deleteDirectory: ', resp);

                    trackEvent(EventType.DeleteDirectory, {
                        count: directoryItemIds.length,
                    });
                    for (const id of directoryItemIds) {
                        cache.remove(id);
                    }

                    if (resp.data.parent) {
                        cache.put(resp.data.parent);
                    }
                }),
            );
        }

        Promise.all(promises)
            .then(onCancel)
            .catch((err) => {
                console.log('deleteItems: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Dialog
            open={true}
            onClose={request.isLoading() ? undefined : onCancel}
            fullWidth
        >
            <DialogTitle>{getDialogTitle(items)}</DialogTitle>
            <DialogContent data-cy='delete-directory-form'>
                <Stack spacing={1}>
                    <DeleteDialogContentText directory={directory} items={items} />

                    {requiresConfirmation && (
                        <>
                            <DialogContentText>
                                To confirm, type `delete` below:
                            </DialogContentText>
                            <TextField
                                data-cy='delete-directory-confirm'
                                placeholder='delete'
                                value={value}
                                onChange={(e) => setValue(e.target.value.toLowerCase())}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onDelete();
                                    }
                                }}
                                fullWidth
                                autoFocus
                            />
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button disabled={request.isLoading()} onClick={onCancel}>
                    Cancel
                </Button>
                <LoadingButton
                    data-cy='delete-directory-button'
                    color='error'
                    disabled={disableDelete}
                    loading={request.isLoading()}
                    onClick={onDelete}
                >
                    {requiresConfirmation ? 'Delete' : 'Remove'}
                </LoadingButton>
            </DialogActions>

            <RequestSnackbar request={request} />
        </Dialog>
    );
};

function getDialogTitle(items: DirectoryItem[]) {
    if (items.length === 1) {
        if (items[0].type === DirectoryItemTypes.DIRECTORY) {
            return `Delete ${items[0].metadata.name}?`;
        }
        return `Remove game?`;
    }

    let directoryCount = 0;
    let gameCount = 0;

    for (const item of items) {
        if (item.type === DirectoryItemTypes.DIRECTORY) {
            directoryCount++;
        } else {
            gameCount++;
        }
    }

    let title = '';

    if (directoryCount > 0) {
        title += `Delete ${directoryCount} folder${directoryCount > 1 ? 's' : ''}`;
        if (gameCount > 0) {
            title += ' and ';
        }
    }
    if (gameCount > 0) {
        if (title === '') {
            title += 'Remove ';
        } else {
            title += 'remove ';
        }
        title += `${gameCount} game${gameCount > 1 ? 's' : ''}`;
    }

    title += '?';
    return title;
}

const DeleteDialogContentText = ({
    directory,
    items,
}: {
    directory: Directory;
    items: DirectoryItem[];
}) => {
    if (items.length === 1) {
        if (items[0].type === DirectoryItemTypes.DIRECTORY) {
            return (
                <DialogContentText>
                    This will <strong>permanently delete</strong> {items[0].metadata.name}{' '}
                    and any folders it contains. Any of your games within these folders
                    will not be deleted and will still be available in the Games tab.
                </DialogContentText>
            );
        }
        return (
            <DialogContentText>
                This will remove the game{' '}
                <strong>
                    {items[0].metadata.white} - {items[0].metadata.black}
                </strong>{' '}
                from the <strong>{directory.name}</strong> folder. The game will still be
                accessible from the Games tab and from any other folders it is in.
            </DialogContentText>
        );
    }

    let directoryCount = 0;
    let gameCount = 0;

    for (const item of items) {
        if (item.type === DirectoryItemTypes.DIRECTORY) {
            directoryCount++;
        } else {
            gameCount++;
        }
    }

    if (directoryCount > 0 && gameCount === 0) {
        return (
            <DialogContentText>
                This will <strong>permanently delete</strong> {directoryCount} folders and
                any subfolders. Any of your games within these folders will not be
                permanently deleted and will still be available in the Games tab and from
                any other folders they may be in.
            </DialogContentText>
        );
    }

    if (directoryCount === 0 && gameCount > 0) {
        return (
            <DialogContentText>
                This will remove {gameCount} games from the{' '}
                <strong>{directory.name}</strong> folder. The games will still be
                accessible from the Games tab and from any other folders they may be in.
            </DialogContentText>
        );
    }

    return (
        <DialogContentText>
            This will delete {directoryCount} folder{directoryCount > 1 && 's'} and remove{' '}
            {gameCount} game{gameCount > 1 && 's'} from the {directory.name} folder. The
            game{gameCount > 1 && 's'} will still be available in the Games tab and from
            any other folders they may be in. However, the folder
            {directoryCount > 1 && 's'} will be <strong>permanently deleted</strong>,
            along with any subfolders.
        </DialogContentText>
    );
};
