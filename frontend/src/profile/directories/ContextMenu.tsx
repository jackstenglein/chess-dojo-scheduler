import {
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Delete,
    DriveFileMoveOutlined,
    DriveFileRenameOutline,
} from '@mui/icons-material';
import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { RenameDialog } from './RenameDialog';

export const ContextMenu = ({
    selectedItem,
    position,
    onClose,
}: {
    selectedItem: DirectoryItem;
    position?: { mouseX: number; mouseY: number };
    onClose: () => void;
}) => {
    console.log('Selected Item: ', selectedItem);
    const [renameOpen, setRenameOpen] = useState(false);

    const onRename = () => {
        setRenameOpen(true);
    };

    const handleClose = () => {
        onClose();
        setRenameOpen(false);
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
                <MenuItem onClick={onRename}>
                    <ListItemIcon>
                        <DriveFileRenameOutline />
                    </ListItemIcon>
                    <ListItemText primary='Rename' />
                </MenuItem>
                <MenuItem>
                    <ListItemIcon>
                        <DriveFileMoveOutlined />
                    </ListItemIcon>
                    <ListItemText primary='Move' />
                </MenuItem>
                <Divider />
                <MenuItem>
                    <ListItemIcon>
                        <Delete />
                    </ListItemIcon>
                    <ListItemText primary='Delete' />
                </MenuItem>
            </Menu>

            {renameOpen && selectedItem.type === DirectoryItemTypes.DIRECTORY && (
                <RenameDialog item={selectedItem} onCancel={handleClose} />
            )}
        </>
    );
};
