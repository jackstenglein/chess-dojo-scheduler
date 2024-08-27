import { CreateDirectoryResponse } from '@/api/directoryApi';
import { useAuth } from '@/auth/Auth';
import { PawnIcon } from '@/style/ChessIcons';
import { Directory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { Add, CreateNewFolder } from '@mui/icons-material';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import { AddCurrentGameMenuItem } from './AddCurrentGameMenuItem';
import { useDirectoryCache } from './DirectoryCache';
import { NewDirectoryDialog } from './NewDirectoryDialog';

export const AddButton = ({ directory }: { directory: Directory }) => {
    const cache = useDirectoryCache();
    const [anchorEl, setAnchorEl] = useState<HTMLElement>();
    const [newDirectoryOpen, setNewDirectoryOpen] = useState(false);
    const { user: viewer } = useAuth();

    if (viewer?.username !== directory.owner) {
        return null;
    }

    const handleClose = () => {
        setNewDirectoryOpen(false);
        setAnchorEl(undefined);
    };

    const onNewDirectorySuccess = (resp: CreateDirectoryResponse) => {
        cache.put(resp.parent);
        cache.put(resp.directory);
        handleClose();
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

                <MenuItem onClick={() => setNewDirectoryOpen(true)}>
                    <ListItemIcon>
                        <CreateNewFolder />
                    </ListItemIcon>
                    <ListItemText primary='New Folder' />
                </MenuItem>

                <MenuItem component='a' href={`/games/import?directory=${directory.id}`}>
                    <ListItemIcon>
                        <PawnIcon />
                    </ListItemIcon>
                    <ListItemText primary='New Game' />
                </MenuItem>
            </Menu>

            {newDirectoryOpen && (
                <NewDirectoryDialog
                    parent={directory.id}
                    onSuccess={onNewDirectorySuccess}
                    onCancel={handleClose}
                />
            )}
        </>
    );
};
