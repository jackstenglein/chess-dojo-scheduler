import { Request } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { useDirectory } from '@/components/profile/directories/DirectoryCache';
import { HOME_DIRECTORY_ID } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { FolderOutlined } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Button } from '@mui/material';
import { useState } from 'react';
import { DirectorySelectDialog } from './DirectorySelectDialog';

export function DirectorySelectButton<T>({
    request,
    onSelect,
}: {
    /** The API request, if any associated with this directory select. */
    request?: Request<T>;

    /**
     * Callback invoked when the user clicks the confirm button in the dialog.
     * Returns true if the dialog should close.
     */
    onSelect: (directory: { owner: string; id: string }) => Promise<boolean>;
}) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [directoryInfo, setDirectoryInfo] = useState({
        owner: user?.username || '',
        id: HOME_DIRECTORY_ID,
    });
    const { directory } = useDirectory(directoryInfo.owner, directoryInfo.id);

    const onChange = (value: { owner: string; id: string }) => {
        if (request?.isLoading()) {
            return;
        }

        setDirectoryInfo(value);
        request?.reset();
    };

    const onClose = () => {
        setOpen(false);
        request?.reset();
    };

    const onConfirm = async () => {
        const shouldClose = await onSelect(directoryInfo);
        setOpen(!shouldClose);
    };

    if (!user) {
        return null;
    }

    return (
        <>
            <Button
                variant='contained'
                startIcon={<FolderOutlined />}
                onClick={() => setOpen(true)}
            >
                Add to Folder
            </Button>

            <DirectorySelectDialog
                slotProps={{
                    dialog: {
                        open,
                        onClose: request?.isLoading() ? undefined : onClose,
                        fullWidth: true,
                    },
                    dialogTitle: {
                        children: `Add current game to ${directory?.name || 'folder'}?`,
                    },
                    dialogActions: {
                        children: (
                            <>
                                <Button onClick={request?.isLoading() ? undefined : onClose}>
                                    Cancel
                                </Button>
                                <LoadingButton loading={request?.isLoading()} onClick={onConfirm}>
                                    Add
                                </LoadingButton>
                            </>
                        ),
                    },
                }}
                value={directoryInfo}
                onChange={onChange}
            />
        </>
    );
}
