import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { TimelineEntry } from '@/database/timeline';
import { Delete, Edit } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Tooltip,
} from '@mui/material';
import { useState } from 'react';

export function NewsfeedItemEditor({ entry }: { entry: TimelineEntry }) {
    const [showDelete, setShowDelete] = useState(false);

    return (
        <>
            <Tooltip title='Edit Activity'>
                <IconButton color='primary'>
                    <Edit />
                </IconButton>
            </Tooltip>
            <Tooltip title='Delete Activity'>
                <IconButton color='primary' onClick={() => setShowDelete(true)}>
                    <Delete />
                </IconButton>
            </Tooltip>

            {showDelete && (
                <DeleteDialog entry={entry} onClose={() => setShowDelete(false)} />
            )}
        </>
    );
}

function DeleteDialog({ entry, onClose }: { entry: TimelineEntry; onClose: () => void }) {
    const request = useRequest();
    const api = useApi();

    return (
        <Dialog open={true} onClose={request.isLoading() ? undefined : onClose}>
            <DialogTitle>Delete Activity?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete this activity? This action cannot be
                    undone, and you will have to manually recreate the activity if you
                    want to add it back.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button disabled={request.isLoading()} onClick={onClose}>
                    Cancel
                </Button>
                <LoadingButton loading={request.isLoading()}>Delete</LoadingButton>
            </DialogActions>

            <RequestSnackbar request={request} />
        </Dialog>
    );
}
