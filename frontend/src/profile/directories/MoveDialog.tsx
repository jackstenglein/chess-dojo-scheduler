import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useRequiredAuth } from '@/auth/Auth';
import { RenderPlayers } from '@/games/list/GameListItem';
import LoadingPage from '@/loading/LoadingPage';
import CohortIcon from '@/scoreboard/CohortIcon';
import {
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { ChevronRight, Folder } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { DirectoryBreadcrumbs } from './DirectoryBreadcrumbs';
import { useDirectory } from './DirectoryCache';

export const MoveDialog = ({
    parent,
    items,
    onCancel,
}: {
    parent: Directory;
    items: DirectoryItem[];
    onCancel: () => void;
}) => {
    const { user } = useRequiredAuth();
    const moveRequest = useRequest();
    const [newDirectoryId, setNewDirectoryId] = useState('home');
    const api = useApi();

    const {
        directory: newDirectory,
        request,
        putDirectory,
        updateDirectory,
    } = useDirectory(user.username, newDirectoryId);

    const disabled = parent.id === newDirectoryId;

    const onNavigate = (id: string) => {
        setNewDirectoryId(id);
    };

    const onMove = () => {
        if (disabled) {
            return;
        }

        moveRequest.onStart();
        api.moveDirectoryItems({
            source: parent.id,
            target: newDirectoryId,
            items: items.map((item) => item.id),
        })
            .then((resp) => {
                console.log('moveDirectoryItems: ', resp);
                moveRequest.onSuccess();
                onCancel();
                putDirectory(resp.data.source);
                putDirectory(resp.data.target);

                for (const item of items) {
                    if (item.type === DirectoryItemTypes.DIRECTORY) {
                        updateDirectory({
                            owner: user.username,
                            id: item.id,
                            parent: newDirectoryId,
                            name: item.metadata.name,
                        });
                    }
                }
            })
            .catch((err) => {
                console.error('moveDirectoryItems: ', err);
                moveRequest.onFailure(err);
            });
    };

    return (
        <Dialog
            open={true}
            onClose={moveRequest.isLoading() ? undefined : onCancel}
            fullWidth
        >
            <DialogTitle>{getDialogTitle(items)}</DialogTitle>
            <DialogContent data-cy='move-directory-form'>
                {newDirectory ? (
                    <Stack>
                        <Stack alignItems='center' direction='row' spacing={1.5}>
                            <Typography color='text.secondary'>From:</Typography>
                            <DirectoryBreadcrumbs
                                owner={user.username}
                                id={parent.id}
                                onClick={onNavigate}
                                variant='body1'
                            />
                        </Stack>

                        <Stack alignItems='center' direction='row' spacing={1.5} mb={1}>
                            <Typography color='text.secondary'>To:</Typography>
                            <DirectoryBreadcrumbs
                                owner={user.username}
                                id={newDirectoryId}
                                onClick={onNavigate}
                                variant='body1'
                            />
                        </Stack>

                        <List>
                            {Object.values(newDirectory.items)
                                .sort((lhs, rhs) => lhs.type.localeCompare(rhs.type))
                                .map((newItem) => (
                                    <MoveListItem
                                        key={newItem.id}
                                        item={newItem}
                                        onNavigate={onNavigate}
                                        disabled={items.some(
                                            (item) => item.id === newItem.id,
                                        )}
                                    />
                                ))}
                        </List>
                        {Object.values(newDirectory.items).length === 0 && (
                            <Typography textAlign='center' width={1}>
                                This folder is empty
                            </Typography>
                        )}
                    </Stack>
                ) : request.isLoading() ? (
                    <LoadingPage />
                ) : null}
            </DialogContent>
            <DialogActions>
                <Button disabled={moveRequest.isLoading()} onClick={onCancel}>
                    Cancel
                </Button>
                <LoadingButton
                    loading={moveRequest.isLoading()}
                    disabled={disabled}
                    onClick={onMove}
                >
                    Move
                </LoadingButton>
            </DialogActions>

            <RequestSnackbar request={moveRequest} />
        </Dialog>
    );
};

export function MoveListItem({
    item,
    onNavigate,
    disabled,
}: {
    item: DirectoryItem;
    onNavigate: (id: string) => void;
    disabled?: boolean;
}) {
    if (item.type === DirectoryItemTypes.DIRECTORY) {
        return (
            <ListItemButton disabled={disabled} onClick={() => onNavigate(item.id)}>
                <ListItemIcon>
                    <Folder />
                </ListItemIcon>
                <ListItemText primary={item.metadata.name} />
                <ChevronRight />
            </ListItemButton>
        );
    }

    return (
        <ListItemButton disabled>
            <ListItemIcon>
                <CohortIcon
                    cohort={item.metadata.cohort}
                    tooltip={item.metadata.cohort}
                    size={25}
                />
            </ListItemIcon>
            <ListItemText primary={RenderPlayers(item.metadata)} />
        </ListItemButton>
    );
}

function getDialogTitle(items: DirectoryItem[]) {
    if (items.length === 1) {
        const item = items[0];
        if (item.type === DirectoryItemTypes.DIRECTORY) {
            return `Move ${item.metadata.name}?`;
        }
        return `Move game?`;
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

    let title = 'Move ';
    if (directoryCount > 0) {
        title += `${directoryCount} folder${directoryCount > 1 ? 's' : ''}`;
        if (gameCount > 0) {
            title += ' and ';
        }
    }
    if (gameCount > 0) {
        title += `${gameCount} game${gameCount > 1 ? 's' : ''}`;
    }

    title += '?';
    return title;
}
