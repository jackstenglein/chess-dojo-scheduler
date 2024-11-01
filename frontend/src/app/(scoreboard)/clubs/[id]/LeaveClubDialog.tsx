import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { leaveClub } from '@/api/clubApi';
import { ClubDetails } from '@/database/club';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

interface LeaveClubDialogProps {
    clubId: string;
    clubName: string;
    approvalRequired: boolean;
    open: boolean;
    onSuccess: (club: ClubDetails) => void;
    onClose: () => void;
}

export const LeaveClubDialog: React.FC<LeaveClubDialogProps> = ({
    clubId,
    clubName,
    approvalRequired,
    open,
    onSuccess,
    onClose,
}) => {
    const api = useApi();
    const request = useRequest();

    const onLeave = () => {
        request.onStart();
        api.leaveClub(clubId)
            .then((resp) => {
                console.log('leaveClub: ', leaveClub);
                onSuccess(resp.data);
            })
            .catch((err) => {
                console.error('leaveClub: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Dialog
            maxWidth='sm'
            fullWidth
            open={open}
            onClose={request.isLoading() ? undefined : onClose}
        >
            <RequestSnackbar request={request} />

            <DialogTitle>Leave {clubName}?</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {approvalRequired
                        ? 'If you want to rejoin later, you will have to request approval again.'
                        : 'You can rejoin later if you want.'}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button disabled={request.isLoading()} onClick={onClose}>
                    Cancel
                </Button>
                <LoadingButton loading={request.isLoading()} onClick={onLeave}>
                    Leave Club
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};
