import { DirectoryCacheProvider } from '@/components/profile/directories/DirectoryCache';
import { GameInfo } from '@/database/game';
import { ListItemIcon, ListItemText, Menu, MenuItem, PopoverPosition } from '@mui/material';
import { Dispatch, SetStateAction } from 'react';
import { BulkGameEditorDialogs, useBulkGameEditor } from './BulkGameEditor';

export const ListItemContextMenu = ({
    games,
    position,
    onClose,
    allowEdits,
    setGames,
}: {
    games?: GameInfo[];
    position: PopoverPosition | undefined;
    onClose: () => void;
    /** Whether to show options related to editing games. */
    allowEdits?: boolean;
    /** Callback invoked to update the cached list of games after they have been edited. */
    setGames?: Dispatch<SetStateAction<GameInfo[]>>;
}) => {
    const editor = useBulkGameEditor({ games, setGames, onClear: onClose, allowEdits });

    return (
        <DirectoryCacheProvider>
            <Menu
                open={!!games?.length}
                onClose={onClose}
                anchorReference='anchorPosition'
                anchorPosition={position}
                slotProps={{
                    root: {
                        onContextMenu: (e: React.MouseEvent) => {
                            e.preventDefault();
                            editor.handleClose();
                        },
                    },
                }}
            >
                {editor.actions.map((action) => (
                    <MenuItem key={action.title} onClick={action.onClick}>
                        <ListItemIcon>{action.icon}</ListItemIcon>
                        <ListItemText primary={action.title} />
                    </MenuItem>
                ))}
            </Menu>

            <BulkGameEditorDialogs editor={editor} />
        </DirectoryCacheProvider>
    );
};
