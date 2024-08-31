import { useApi } from '@/api/Api';
import { Request } from '@/api/Request';
import {
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
    DirectoryVisibilityType,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Delete,
    DriveFileMoveOutlined,
    DriveFileRenameOutline,
    FolderOff,
} from '@mui/icons-material';
import {
    Divider,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    PopoverPosition,
} from '@mui/material';
import { useState } from 'react';
import { DeleteDialog } from './DeleteDialog';
import { useDirectoryCache } from './DirectoryCache';
import { MoveDialog } from './MoveDialog';
import { UpdateDirectoryDialog } from './UpdateDirectoryDialog';

export const ContextMenu = ({
    directory,
    selectedItem,
    position,
    onClose,
}: {
    directory: Directory;
    selectedItem?: DirectoryItem;
    position?: PopoverPosition;
    onClose: () => void;
}) => {
    const [renameOpen, setRenameOpen] = useState(false);
    const [moveOpen, setMoveOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const api = useApi();
    const cache = useDirectoryCache();

    if (!selectedItem) {
        return null;
    }

    const isDirectory = selectedItem.type === DirectoryItemTypes.DIRECTORY;

    const onRename = () => {
        setRenameOpen(true);
    };

    const onMove = () => {
        setMoveOpen(true);
    };

    const onDelete = () => {
        setDeleteOpen(true);
    };

    const handleClose = () => {
        onClose();
        setRenameOpen(false);
        setMoveOpen(false);
        setDeleteOpen(false);
    };

    const onUpdateDirectory = (
        name: string,
        visibility: DirectoryVisibilityType,
        disabled: boolean,
        request: Request,
    ) => {
        if (disabled || request.isLoading()) {
            return;
        }

        if (
            Object.values(directory.items || {}).some(
                (item) =>
                    item.type === DirectoryItemTypes.DIRECTORY &&
                    item.metadata.name === name &&
                    item.id !== selectedItem.id,
            )
        ) {
            request.onFailure({ message: `${directory.name}/${name} already exists` });
            return;
        }

        request.onStart();
        api.updateDirectory({
            id: selectedItem.id,
            name,
            visibility,
        })
            .then((resp) => {
                console.log('updateDirectory: ', resp);
                cache.put(resp.data.directory);
                if (resp.data.parent) {
                    cache.put(resp.data.parent);
                }
                handleClose();
            })
            .catch((err) => {
                console.error('updateDirectory: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <Menu
                open={!!selectedItem && !renameOpen}
                onClose={onClose}
                anchorReference='anchorPosition'
                anchorPosition={position}
                slotProps={{
                    root: {
                        onContextMenu: (e) => {
                            e.preventDefault();
                            onClose();
                        },
                    },
                }}
            >
                {isDirectory && (
                    <MenuItem onClick={onRename}>
                        <ListItemIcon>
                            <DriveFileRenameOutline />
                        </ListItemIcon>
                        <ListItemText primary='Edit Name/Visibility' />
                    </MenuItem>
                )}
                <MenuItem onClick={onMove}>
                    <ListItemIcon>
                        <DriveFileMoveOutlined />
                    </ListItemIcon>
                    <ListItemText primary='Move' />
                </MenuItem>
                <Divider />
                <MenuItem onClick={onDelete}>
                    <ListItemIcon>
                        {isDirectory ? <Delete /> : <FolderOff />}
                    </ListItemIcon>
                    <ListItemText
                        primary={isDirectory ? 'Delete' : 'Remove from Folder'}
                    />
                </MenuItem>
            </Menu>

            {renameOpen && selectedItem.type === DirectoryItemTypes.DIRECTORY && (
                <UpdateDirectoryDialog
                    initialName={selectedItem.metadata.name}
                    initialVisibility={selectedItem.metadata.visibility}
                    title='Edit Folder'
                    saveLabel='Save'
                    disableSave={(name, visibility) =>
                        name.trim().length === 0 ||
                        name.trim().length > 100 ||
                        (name === selectedItem.metadata.name &&
                            visibility === selectedItem.metadata.visibility)
                    }
                    onSave={onUpdateDirectory}
                    onCancel={handleClose}
                />
            )}
            {moveOpen && (
                <MoveDialog
                    item={selectedItem}
                    onCancel={handleClose}
                    parent={directory}
                />
            )}
            {deleteOpen && (
                <DeleteDialog
                    directory={directory}
                    item={selectedItem}
                    onCancel={handleClose}
                />
            )}
        </>
    );
};
