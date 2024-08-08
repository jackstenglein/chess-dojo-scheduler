import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { DirectoryItemSubdirectory } from '@jackstenglein/chess-dojo-common/src/database/directory';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import { useDirectoryCache } from './DirectoryCache';

export const RenameDialog = ({
    item,
    onCancel,
}: {
    item: DirectoryItemSubdirectory;
    onCancel: () => void;
}) => {
    const [name, setName] = useState(item.metadata.name);
    const request = useRequest();
    const api = useApi();
    const cache = useDirectoryCache();

    const disableSave = name.trim().length === 0 || name === item.metadata.name;

    const onSave = () => {
        if (disableSave) {
            return;
        }

        request.onStart();
        api.updateDirectory({
            id: item.id,
            name,
        })
            .then((resp) => {
                console.log('updateDirectory: ', resp);
                cache.put(resp.data.directory);
                cache.put(resp.data.parent);
                onCancel();
            })
            .catch((err) => {
                console.error('updateDirectory: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Dialog
            open={true}
            onClose={request.isLoading() ? undefined : onCancel}
            fullWidth
        >
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogContent data-cy='directory-rename-form'>
                <TextField
                    data-cy='directory-rename-new-name'
                    label='Name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    sx={{ mt: 0.75 }}
                />
            </DialogContent>
            <DialogActions>
                <Button disabled={request.isLoading()} onClick={onCancel}>
                    Cancel
                </Button>
                <LoadingButton
                    data-cy='directory-rename-save-button'
                    disabled={disableSave}
                    loading={request.isLoading()}
                    onClick={onSave}
                >
                    Save
                </LoadingButton>
            </DialogActions>

            <RequestSnackbar request={request} />
        </Dialog>
    );
};
