import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { useSearchParams } from '@/hooks/useSearchParams';
import {
    DirectoryItem,
    DirectoryItemSubdirectory,
    DirectoryItemTypes,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import { useDirectoryCache } from './DirectoryCache';

export const DeleteDialog = ({
    item,
    onCancel,
}: {
    item: DirectoryItem;
    onCancel: () => void;
}) => {
    if (item.type === DirectoryItemTypes.DIRECTORY) {
        return <DeleteDirectoryDialog item={item} onCancel={onCancel} />;
    }

    return null;
};

const DeleteDirectoryDialog = ({
    item,
    onCancel,
}: {
    item: DirectoryItemSubdirectory;
    onCancel: () => void;
}) => {
    const [value, setValue] = useState('');
    const request = useRequest();
    const disableDelete = value.trim() !== 'permanently delete';
    const api = useApi();
    const cache = useDirectoryCache();
    const { updateSearchParams } = useSearchParams();

    const onDelete = () => {
        if (disableDelete) {
            return;
        }

        request.onStart();
        api.deleteDirectory(item.id)
            .then((resp) => {
                console.log('deleteDirectory: ', resp);
                cache.remove(item.id);
                onCancel();
                if (resp.data.parent) {
                    cache.put(resp.data.parent);
                    updateSearchParams({ directory: resp.data.parent.id });
                }
            })
            .catch((err) => {
                console.error('deleteDirectory: ', err);
                request.onFailure(err);
            });

        return null;
    };

    return (
        <Dialog
            open={true}
            onClose={request.isLoading() ? undefined : onCancel}
            fullWidth
        >
            <DialogTitle>Delete {item.metadata.name}?</DialogTitle>
            <DialogContent>
                <Stack spacing={1}>
                    <DialogContentText>
                        This will permanently delete {item.metadata.name} and any folders
                        it contains. Any games within these folders will not be deleted
                        and will still be available in the Games tab.
                    </DialogContentText>

                    <DialogContentText>
                        To confirm, type `permanently delete` below:
                    </DialogContentText>
                    <TextField
                        placeholder='permanently delete'
                        value={value}
                        onChange={(e) => setValue(e.target.value.toLowerCase())}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button disabled={request.isLoading()} onClick={onCancel}>
                    Cancel
                </Button>
                <LoadingButton
                    color='error'
                    disabled={disableDelete}
                    loading={request.isLoading()}
                    onClick={onDelete}
                >
                    Delete
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};
