import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';
import { CustomTask } from '../database/requirement';
import { RequestSnackbar, useRequest } from '../api/Request';
import { LoadingButton } from '@mui/lab';
import { useAuth } from '../auth/Auth';
import { useApi } from '../api/Api';
import { EventType, trackEvent } from '../analytics/events';

interface DeleteCustomTaskModalProps {
    task: CustomTask;
    open: boolean;
    onCancel: () => void;
    onDelete?: () => void;
}

const DeleteCustomTaskModal: React.FC<DeleteCustomTaskModalProps> = ({
    task,
    open,
    onCancel,
    onDelete,
}) => {
    const user = useAuth().user!;
    const api = useApi();
    const request = useRequest();

    const handleDelete = () => {
        const newTasks = user.customTasks?.filter((t) => t.id !== task.id) || [];

        request.onStart();
        api.updateUser({
            customTasks: newTasks,
        })
            .then((resp) => {
                console.log('updateUser: ', resp);
                trackEvent(EventType.DeleteNondojoTask, {
                    task_id: task.id,
                    task_name: task.name,
                });
                if (onDelete) {
                    onDelete();
                }
                request.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Dialog
            open={open}
            onClose={request.isLoading() ? undefined : onCancel}
            maxWidth='sm'
        >
            <RequestSnackbar request={request} />

            <DialogTitle>Delete {task.name}?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    This custom task will be removed from your profile, and all time
                    logged will be lost. This action is irreverisble.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={request.isLoading()}>
                    Cancel
                </Button>

                <LoadingButton
                    color='error'
                    loading={request.isLoading()}
                    onClick={handleDelete}
                >
                    Delete Task
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteCustomTaskModal;
