import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { User } from '@/database/user';
import {
    RoundRobin,
    RoundRobinStatuses,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material';

interface WithdrawModalProps {
    open: boolean;
    onClose: () => void;
    user: User | undefined;
    cohort: string;
    startsAt: string;
    onUpdateWaitlist: (waitlist: RoundRobin) => void;
}

export function WithdrawModal({
    open,
    onClose,
    user,
    cohort,
    startsAt,
    onUpdateWaitlist,
}: WithdrawModalProps) {
    const request = useRequest<string>();
    const api = useApi();

    if (!user) {
        return null;
    }

    const handleSubmit = async () => {
        try {
            request.onStart();
            const resp = await api.withdrawFromRoundRobin({ cohort, startsAt });
            console.log('withdrawFromRoundRobin: ', resp.data);
            request.onSuccess('Successfully withdrew from round robin');
            if (startsAt === RoundRobinStatuses.WAITING) {
                onUpdateWaitlist(resp.data);
            }

            onClose();
        } catch (err) {
            console.error('withdrawFromRoundRobin: ', err);
            request.onFailure(err);
        }
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={request.isLoading() ? undefined : handleClose}
                fullWidth
            >
                <DialogTitle>Withdraw from Round Robin?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to withdraw?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button disabled={request.isLoading()} onClick={onClose}>
                        Cancel
                    </Button>
                    <LoadingButton loading={request.isLoading()} onClick={handleSubmit}>
                        Withdraw
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            <RequestSnackbar request={request} showSuccess />
        </>
    );
}
