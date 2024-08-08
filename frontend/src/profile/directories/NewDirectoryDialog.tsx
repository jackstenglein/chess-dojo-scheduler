import { useApi } from '@/api/Api';
import { CreateDirectoryResponse } from '@/api/directoryApi';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { DirectoryVisibility } from '@jackstenglein/chess-dojo-common/src/database/directory';
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

export const NewDirectoryDialog = ({
    parent,
    onSuccess,
    onCancel,
}: {
    parent: string;
    onSuccess: (response: CreateDirectoryResponse) => void;
    onCancel: () => void;
}) => {
    const [name, setName] = useState('');
    const api = useApi();
    const request = useRequest();

    const disableCreate = name.trim().length === 0;

    const onCreate = () => {
        if (disableCreate) {
            return;
        }

        request.onStart();
        api.createDirectory({
            id: '',
            parent,
            name,
            visibility: DirectoryVisibility.PUBLIC,
        })
            .then((resp) => {
                console.log('createDirectory: ', resp);
                onSuccess(resp.data);
            })
            .catch((err) => {
                console.error('createDirectory: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Dialog
            open={true}
            onClose={request.isLoading() ? undefined : onCancel}
            fullWidth
        >
            <DialogTitle>New Folder</DialogTitle>
            <DialogContent data-cy='new-directory-form'>
                <TextField
                    data-cy='new-directory-name'
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
                    disabled={disableCreate}
                    loading={request.isLoading()}
                    onClick={onCreate}
                    data-cy='new-directory-create-button'
                >
                    Create
                </LoadingButton>
            </DialogActions>

            <RequestSnackbar request={request} />
        </Dialog>
    );
};
