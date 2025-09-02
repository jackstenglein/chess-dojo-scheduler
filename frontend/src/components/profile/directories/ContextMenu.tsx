import {
    Directory,
    DirectoryAccessRole,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { ListItemIcon, ListItemText, Menu, MenuItem, PopoverPosition } from '@mui/material';
import { ItemEditorDialogs, useDirectoryEditor } from './BulkItemEditor';

export const ContextMenu = ({
    directory,
    accessRole,
    itemIds,
    position,
    onClose,
}: {
    directory: Directory;
    accessRole: DirectoryAccessRole | undefined;
    itemIds: string[];
    position?: PopoverPosition;
    onClose: () => void;
}) => {
    const editor = useDirectoryEditor({ directory, itemIds, accessRole, onClose });
    if (editor.items.length === 0) {
        return null;
    }

    return (
        <>
            <Menu
                open={true}
                onClose={onClose}
                anchorReference='anchorPosition'
                anchorPosition={position}
                slotProps={{
                    root: {
                        onContextMenu: (e: React.MouseEvent) => {
                            e.preventDefault();
                            onClose();
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

            <ItemEditorDialogs editor={editor} />
        </>
    );
};
