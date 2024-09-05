import {
    Directory,
    DirectoryItemTypes,
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
import { ItemEditorDialogs, useDirectoryEditor } from './BulkItemEditor';

export const ContextMenu = ({
    directory,
    itemIds,
    position,
    onClose,
}: {
    directory: Directory;
    itemIds: string[];
    position?: PopoverPosition;
    onClose: () => void;
}) => {
    const editor = useDirectoryEditor(directory, itemIds, onClose);

    if (editor.items.length === 0) {
        return null;
    }

    const isDirectory =
        editor.items.length === 1 &&
        editor.items[0].type === DirectoryItemTypes.DIRECTORY;

    return (
        <>
            <Menu
                open={true}
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
                    <MenuItem onClick={editor.onRename}>
                        <ListItemIcon>
                            <DriveFileRenameOutline />
                        </ListItemIcon>
                        <ListItemText primary='Edit Name/Visibility' />
                    </MenuItem>
                )}
                <MenuItem onClick={editor.onMove}>
                    <ListItemIcon>
                        <DriveFileMoveOutlined />
                    </ListItemIcon>
                    <ListItemText primary='Move' />
                </MenuItem>
                <Divider />
                <MenuItem onClick={editor.onDelete}>
                    <ListItemIcon>
                        {isDirectory ? <Delete /> : <FolderOff />}
                    </ListItemIcon>
                    <ListItemText
                        primary={isDirectory ? 'Delete' : 'Remove from Folder'}
                    />
                </MenuItem>
            </Menu>

            <ItemEditorDialogs editor={editor} />
        </>
    );
};
