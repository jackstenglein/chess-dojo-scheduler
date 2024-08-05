import {
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Delete,
    DriveFileMoveOutlined,
    DriveFileRenameOutline,
    FolderOff,
} from '@mui/icons-material';
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { DeleteDialog } from './DeleteDialog';
import { RenameDialog } from './RenameDialog';

export const ContextMenu = ({
    directory,
    selectedItem,
    position,
    onClose,
}: {
    directory: Directory;
    selectedItem?: DirectoryItem;
    position?: { mouseX: number; mouseY: number };
    onClose: () => void;
}) => {
    const [renameOpen, setRenameOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    if (!selectedItem) {
        return null;
    }

    const isDirectory = selectedItem.type === DirectoryItemTypes.DIRECTORY;

    const onRename = () => {
        setRenameOpen(true);
    };

    const onDelete = () => {
        setDeleteOpen(true);
    };

    const handleClose = () => {
        onClose();
        setRenameOpen(false);
        setDeleteOpen(false);
    };

    return (
        <>
            <Menu
                open={!!selectedItem && !renameOpen}
                onClose={onClose}
                anchorReference='anchorPosition'
                anchorPosition={
                    position ? { top: position.mouseY, left: position.mouseX } : undefined
                }
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
                        <ListItemText primary='Rename' />
                    </MenuItem>
                )}
                <MenuItem>
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
                <RenameDialog item={selectedItem} onCancel={handleClose} />
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
