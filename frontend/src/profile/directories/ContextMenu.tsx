import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
    DirectoryItemTypes,
    SHARED_DIRECTORY_ID,
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
    const editor = useDirectoryEditor(directory, itemIds, onClose);

    if (editor.items.length === 0) {
        return null;
    }

    const isDirectory =
        editor.items.length === 1 &&
        editor.items[0].type === DirectoryItemTypes.DIRECTORY;

    const isAdmin = compareRoles(DirectoryAccessRole.Admin, accessRole);

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
                {isDirectory && isAdmin && (
                    <MenuItem onClick={editor.onRename}>
                        <ListItemIcon>
                            <DriveFileRenameOutline />
                        </ListItemIcon>
                        <ListItemText primary='Edit Name/Visibility' />
                    </MenuItem>
                )}
                {directory.id !== SHARED_DIRECTORY_ID && (
                    <>
                        <MenuItem onClick={editor.onMove}>
                            <ListItemIcon>
                                <DriveFileMoveOutlined />
                            </ListItemIcon>
                            <ListItemText primary='Move' />
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={editor.onRemove}>
                            <ListItemIcon>
                                {isDirectory ? <Delete /> : <FolderOff />}
                            </ListItemIcon>
                            <ListItemText
                                primary={isDirectory ? 'Delete' : 'Remove from Folder'}
                            />
                        </MenuItem>
                    </>
                )}
            </Menu>

            <ItemEditorDialogs editor={editor} />
        </>
    );
};
