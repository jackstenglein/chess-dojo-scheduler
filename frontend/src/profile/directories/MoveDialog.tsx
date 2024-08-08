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
import { Folder } from '@mui/icons-material';
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
    item,
    onCancel,
}: {
    parent: Directory;
    item: DirectoryItem;
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
            items: [item.id],
        })
            .then((resp) => {
                console.log('moveDirectoryItems: ', resp);
                moveRequest.onSuccess();
                onCancel();
                putDirectory(resp.data.source);
                putDirectory(resp.data.target);
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
            <DialogTitle>
                Move{' '}
                {item.type === DirectoryItemTypes.DIRECTORY ? item.metadata.name : 'game'}
                ?
            </DialogTitle>
            <DialogContent>
                {newDirectory ? (
                    <Stack>
                        <Stack direction='row' spacing={1.5}>
                            <Typography color='text.secondary'>
                                Current Location:
                            </Typography>
                            <DirectoryBreadcrumbs
                                owner={user.username}
                                id={parent.id}
                                onClick={onNavigate}
                            />
                        </Stack>

                        <Stack direction='row' spacing={1.5} mb={1}>
                            <Typography color='text.secondary'>New Location:</Typography>
                            <DirectoryBreadcrumbs
                                owner={user.username}
                                id={newDirectoryId}
                                onClick={onNavigate}
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
                                        disabled={item.id === newItem.id}
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

function MoveListItem({
    item,
    onNavigate,
    disabled,
}: {
    item: DirectoryItem;
    onNavigate: (id: string) => void;
    disabled: boolean;
}) {
    if (item.type === DirectoryItemTypes.DIRECTORY) {
        return (
            <ListItemButton disabled={disabled} onClick={() => onNavigate(item.id)}>
                <ListItemIcon>
                    <Folder />
                </ListItemIcon>
                <ListItemText primary={item.metadata.name} />
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
