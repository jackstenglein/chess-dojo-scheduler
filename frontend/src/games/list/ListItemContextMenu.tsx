import { GameInfo } from '@/database/game';
import { DirectoryCacheProvider } from '@/profile/directories/DirectoryCache';
import { CreateNewFolder } from '@mui/icons-material';
import { ListItemIcon, ListItemText, Menu, MenuItem, PopoverPosition } from '@mui/material';
import { useState } from 'react';
import { AddToDirectoryDialog } from './AddToDirectoryDialog';

export const ListItemContextMenu = ({
    game,
    position,
    onClose,
}: {
    game?: GameInfo;
    position: PopoverPosition | undefined;
    onClose: () => void;
}) => {
    const [directoryPickerOpen, setDirectoryPickerOpen] = useState(false);

    const handleClose = () => {
        setDirectoryPickerOpen(false);
        onClose();
    };

    return (
        <DirectoryCacheProvider>
            <Menu
                open={!!game}
                onClose={onClose}
                anchorReference='anchorPosition'
                anchorPosition={position}
                slotProps={{
                    root: {
                        onContextMenu: (e) => {
                            e.preventDefault();
                            handleClose();
                        },
                    },
                }}
            >
                <MenuItem onClick={() => setDirectoryPickerOpen(true)}>
                    <ListItemIcon>
                        <CreateNewFolder />
                    </ListItemIcon>
                    <ListItemText primary='Add to Folder' />
                </MenuItem>
            </Menu>

            <AddToDirectoryDialog open={directoryPickerOpen} game={game} onClose={handleClose} />
        </DirectoryCacheProvider>
    );
};
