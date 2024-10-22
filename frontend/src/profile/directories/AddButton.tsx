import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { Request } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { PawnIcon } from '@/style/ChessIcons';
import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
    DirectoryVisibilityType,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Add, CreateNewFolder } from '@mui/icons-material';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import Avatar from '../Avatar';
import { AddCurrentGameMenuItem } from './AddCurrentGameMenuItem';
import { AddExistingGamesDialog } from './AddExistingGamesDialog';
import { useDirectoryCache } from './DirectoryCache';
import { UpdateDirectoryDialog } from './UpdateDirectoryDialog';

export const AddButton = ({
    directory,
    accessRole,
}: {
    directory: Directory;
    accessRole?: DirectoryAccessRole;
}) => {
    const cache = useDirectoryCache();
    const [anchorEl, setAnchorEl] = useState<HTMLElement>();
    const [newDirectoryOpen, setNewDirectoryOpen] = useState(false);
    const [existingGamesOpen, setExistingGamesOpen] = useState(false);
    const { user: viewer } = useAuth();
    const api = useApi();

    const canEdit = compareRoles(DirectoryAccessRole.Editor, accessRole);
    const canCreateNewFolders = compareRoles(DirectoryAccessRole.Admin, accessRole);

    if (!canEdit) {
        return null;
    }

    const handleClose = () => {
        setNewDirectoryOpen(false);
        setExistingGamesOpen(false);
        setAnchorEl(undefined);
    };

    const onNewDirectory = (
        name: string,
        visibility: DirectoryVisibilityType,
        disabled: boolean,
        request: Request,
    ) => {
        if (disabled || request.isLoading()) {
            return;
        }

        request.onStart();
        api.createDirectory({
            id: '',
            parent: directory.id,
            name,
            visibility,
        })
            .then((resp) => {
                console.log('createDirectory: ', resp);
                cache.put(resp.data.parent);
                cache.put(resp.data.directory);
                trackEvent(EventType.CreateDirectory, { visibility });
                handleClose();
            })
            .catch((err) => {
                console.error('createDirectory: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <Button
                variant='contained'
                startIcon={<Add />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
            >
                Add
            </Button>

            <Menu open={!!anchorEl} onClose={handleClose} anchorEl={anchorEl}>
                <AddCurrentGameMenuItem directory={directory} onSuccess={handleClose} />

                <MenuItem
                    disabled={!canCreateNewFolders}
                    onClick={() => setNewDirectoryOpen(true)}
                >
                    <ListItemIcon>
                        <CreateNewFolder />
                    </ListItemIcon>
                    <ListItemText
                        primary='New Folder'
                        secondary={
                            canCreateNewFolders
                                ? undefined
                                : 'Missing required admin permissions'
                        }
                    />
                </MenuItem>

                <MenuItem component='a' href={`/games/import?directory=${directory.id}`}>
                    <ListItemIcon>
                        <PawnIcon />
                    </ListItemIcon>
                    <ListItemText primary='New Game' />
                </MenuItem>

                <MenuItem onClick={() => setExistingGamesOpen(true)}>
                    <ListItemIcon>
                        <Avatar user={viewer} size={20} />
                    </ListItemIcon>
                    <ListItemText primary='My Existing Games' />
                </MenuItem>
            </Menu>

            {newDirectoryOpen && (
                <UpdateDirectoryDialog onSave={onNewDirectory} onCancel={handleClose} />
            )}
            {existingGamesOpen && (
                <AddExistingGamesDialog directory={directory} onCancel={handleClose} />
            )}
        </>
    );
};
