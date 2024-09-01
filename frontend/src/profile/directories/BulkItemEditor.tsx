import { useApi } from '@/api/Api';
import {
    Directory,
    DirectoryItem,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Close,
    Delete,
    DriveFileMoveOutlined,
    DriveFileRenameOutline,
    FolderOff,
} from '@mui/icons-material';
import { IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { DeleteDialog } from './DeleteDialog';
import { useDirectoryCache } from './DirectoryCache';
import { MoveDialog } from './MoveDialog';
import { onUpdateDirectory, UpdateDirectoryDialog } from './UpdateDirectoryDialog';

interface UseDirectoryEditorResponse {
    directory: Directory;
    items: DirectoryItem[];
    renameOpen: boolean;
    moveOpen: boolean;
    deleteOpen: boolean;
    onRename: () => void;
    onMove: () => void;
    onDelete: () => void;
    handleClose: () => void;
}

export function useDirectoryEditor(
    directory: Directory,
    itemIds: string[],
    onClose: () => void,
): UseDirectoryEditorResponse {
    const items = useMemo(() => {
        return itemIds.map((id) => directory.items[id]).filter((item) => item);
    }, [directory, itemIds]);

    const [renameOpen, setRenameOpen] = useState(false);
    const [moveOpen, setMoveOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

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

    return {
        directory,
        items,
        renameOpen,
        moveOpen,
        deleteOpen,
        onRename,
        onMove,
        onDelete,
        handleClose,
    };
}

export const BulkItemEditor = ({
    directory,
    itemIds,
    onClear,
}: {
    directory: Directory;
    itemIds: string[];
    onClear: () => void;
}) => {
    const editor = useDirectoryEditor(directory, itemIds, onClear);
    if (editor.items.length === 0) {
        return null;
    }

    const showEdit =
        itemIds.length === 1 &&
        directory.items[itemIds[0]]?.type === DirectoryItemTypes.DIRECTORY;

    return (
        <Paper elevation={4} sx={{ borderRadius: '1.5rem', flexGrow: 1, py: 0.5, px: 1 }}>
            <Stack direction='row' alignItems='center'>
                <Tooltip title='Clear selection'>
                    <IconButton size='small' onClick={onClear}>
                        <Close />
                    </IconButton>
                </Tooltip>

                <Typography sx={{ ml: 1, mr: 2.5 }}>{itemIds.length} selected</Typography>

                {showEdit && (
                    <Tooltip title='Edit Name/Visibility' onClick={editor.onRename}>
                        <IconButton size='small' sx={{ mr: 1 }}>
                            <DriveFileRenameOutline />
                        </IconButton>
                    </Tooltip>
                )}

                <Tooltip title='Move'>
                    <IconButton size='small' sx={{ mr: 1 }} onClick={editor.onMove}>
                        <DriveFileMoveOutlined />
                    </IconButton>
                </Tooltip>

                <Tooltip
                    title={showEdit ? 'Delete' : 'Remove from Folder'}
                    onClick={editor.onDelete}
                >
                    <IconButton size='small' sx={{ mr: 1 }}>
                        {showEdit ? <Delete /> : <FolderOff />}
                    </IconButton>
                </Tooltip>
            </Stack>

            <ItemEditorDialogs editor={editor} />
        </Paper>
    );
};

export const ItemEditorDialogs = ({ editor }: { editor: UseDirectoryEditorResponse }) => {
    const api = useApi();
    const cache = useDirectoryCache();

    if (
        editor.renameOpen &&
        editor.items.length === 1 &&
        editor.items[0].type === DirectoryItemTypes.DIRECTORY
    ) {
        const selectedItem = editor.items[0];

        return (
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
                onSave={onUpdateDirectory(
                    api,
                    cache,
                    editor.directory,
                    selectedItem,
                    editor.handleClose,
                )}
                onCancel={editor.handleClose}
            />
        );
    }

    if (editor.moveOpen) {
        return (
            <MoveDialog
                parent={editor.directory}
                items={editor.items}
                onCancel={editor.handleClose}
            />
        );
    }

    if (editor.deleteOpen) {
        return (
            <DeleteDialog
                directory={editor.directory}
                items={editor.items}
                onCancel={editor.handleClose}
            />
        );
    }

    return null;
};
