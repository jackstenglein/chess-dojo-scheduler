import { useApi } from '@/api/Api';
import { DownloadGamesDialog } from '@/components/games/list/DownloadGamesDialog';
import {
    compareRoles,
    Directory,
    DirectoryAccessRole,
    DirectoryItem,
    DirectoryItemTypes,
    isDefaultDirectory,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import {
    Close,
    Delete,
    Download,
    DriveFileMoveOutlined,
    DriveFileRenameOutline,
    FolderOff,
} from '@mui/icons-material';
import { IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { useMemo, useState, type JSX } from 'react';
import { DeleteDialog, DeleteDialogType } from './DeleteDialog';
import { useDirectoryCache } from './DirectoryCache';
import { MoveDialog } from './MoveDialog';
import { onUpdateDirectory, UpdateDirectoryDialog } from './UpdateDirectoryDialog';

interface UseDirectoryEditorResponse {
    /** The parent directory containing the selected items. */
    directory: Directory;
    /** The items selected to be edited. */
    items: DirectoryItem[];
    /** Whether the rename dialog is open. */
    renameOpen: boolean;
    /** Whether the move dialog is open. */
    moveOpen: boolean;
    /** Whether the download dialog is open. */
    downloadOpen: boolean;
    /**
     * Whether the remove dialog is open. Contrary to the delete dialog, the remove dialog
     * does not fully delete selected games. The games are only removed from the directory.
     */
    removeOpen: boolean;
    /**
     * Whether the delete dialog is open. Contrary to the remove dialog, the delete dialog
     * fully deletes selected games.
     */
    deleteOpen: boolean;
    /** Opens the rename dialog. */
    onRename: () => void;
    /** Opens the move dialog. */
    onMove: () => void;
    /** Opens the download dialog. */
    onDownload: () => void;
    /** Opens the remove dialog. */
    onRemove: () => void;
    /** Opens the delete dialog. */
    onDelete: () => void;
    /** Closes any open dialogs. */
    handleClose: () => void;
    /** The actions the user can take. */
    actions: {
        /** The title of the action. */
        title: string;
        /** The handler for when the user clicks the action. */
        onClick: () => void;
        /** The element to render for the icon of the action. */
        icon: JSX.Element;
    }[];
}

export function useDirectoryEditor({
    directory,
    itemIds,
    accessRole,
    onClose,
}: {
    directory: Directory;
    itemIds: string[];
    accessRole: DirectoryAccessRole | undefined;
    onClose: () => void;
}): UseDirectoryEditorResponse {
    const items = useMemo(() => {
        return itemIds.map((id) => directory.items[id]).filter((item) => item);
    }, [directory, itemIds]);

    const [renameOpen, setRenameOpen] = useState(false);
    const [moveOpen, setMoveOpen] = useState(false);
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const onRename = () => {
        setRenameOpen(true);
    };

    const onMove = () => {
        setMoveOpen(true);
    };

    const onDownload = () => {
        setDownloadOpen(true);
    };

    const onRemove = () => {
        setRemoveOpen(true);
    };

    const onDelete = () => {
        setDeleteOpen(true);
    };

    const handleClose = () => {
        onClose();
        setRenameOpen(false);
        setMoveOpen(false);
        setDownloadOpen(false);
        setRemoveOpen(false);
        setDeleteOpen(false);
    };

    const defaultDirectorySelected = itemIds.some((id) => isDefaultDirectory(id));
    const showEdit =
        !defaultDirectorySelected &&
        itemIds.length === 1 &&
        directory.items[itemIds[0]]?.type === DirectoryItemTypes.DIRECTORY;
    const isAdmin = compareRoles(DirectoryAccessRole.Admin, accessRole);

    const actions = [{ title: 'Download PGN', onClick: onDownload, icon: <Download /> }];

    if (showEdit && isAdmin) {
        actions.push({
            title: 'Edit Name/Visibility',
            onClick: onRename,
            icon: <DriveFileRenameOutline />,
        });
    }

    if (!defaultDirectorySelected) {
        actions.push({ title: 'Move', onClick: onMove, icon: <DriveFileMoveOutlined /> });
    }

    if (showEdit) {
        actions.push({ title: 'Delete', onClick: onDelete, icon: <Delete /> });
    } else if (!defaultDirectorySelected) {
        actions.push(
            { title: 'Remove from Folder', onClick: onRemove, icon: <FolderOff /> },
            { title: 'Delete', onClick: onDelete, icon: <Delete /> },
        );
    }

    return {
        directory,
        items,
        renameOpen,
        moveOpen,
        downloadOpen,
        removeOpen,
        deleteOpen,
        onRename,
        onMove,
        onDownload,
        onRemove,
        onDelete,
        handleClose,
        actions,
    };
}

export const BulkItemEditor = ({
    directory,
    itemIds,
    accessRole,
    onClear,
}: {
    directory: Directory;
    itemIds: string[];
    accessRole: DirectoryAccessRole | undefined;
    onClear: () => void;
}) => {
    const editor = useDirectoryEditor({ directory, itemIds, accessRole, onClose: onClear });
    if (editor.items.length === 0) {
        return null;
    }

    return (
        <Paper elevation={4} sx={{ borderRadius: '1.5rem', flexGrow: 1, py: 0.5, px: 1 }}>
            <Stack direction='row' alignItems='center'>
                <Tooltip title='Clear selection'>
                    <IconButton size='small' onClick={onClear}>
                        <Close />
                    </IconButton>
                </Tooltip>

                <Typography sx={{ ml: 1, mr: 2.5 }}>{itemIds.length} selected</Typography>

                {editor.actions.map((action) => (
                    <Tooltip key={action.title} title={action.title}>
                        <IconButton size='small' sx={{ mr: 1 }} onClick={action.onClick}>
                            {action.icon}
                        </IconButton>
                    </Tooltip>
                ))}
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

    if (editor.downloadOpen) {
        return (
            <DownloadGamesDialog
                directories={editor.items
                    .filter((item) => item.type === DirectoryItemTypes.DIRECTORY)
                    .map((d) => ({ owner: editor.directory.owner, id: d.id }))}
                games={editor.items
                    .filter((item) => item.type !== DirectoryItemTypes.DIRECTORY)
                    .map((g) => ({ cohort: g.metadata.cohort, id: g.metadata.id }))}
                onClose={editor.handleClose}
            />
        );
    }

    if (editor.removeOpen || editor.deleteOpen) {
        return (
            <DeleteDialog
                directory={editor.directory}
                items={editor.items}
                onCancel={editor.handleClose}
                type={editor.removeOpen ? DeleteDialogType.Remove : DeleteDialogType.Delete}
            />
        );
    }

    return null;
};
