import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
} from '@mui/material';
import { useState } from 'react';

import { Close } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { EventType, trackEvent } from '../analytics/events';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Event } from '../database/event';

interface CancelMeetingButtonProps {
    meetingId: string;
    dialogTitle: string;
    dialogContent: string;
    onSuccess: (event: Event) => void;
}

const CancelMeetingButton: React.FC<React.PropsWithChildren<CancelMeetingButtonProps>> = ({
    meetingId,
    dialogTitle,
    dialogContent,
    onSuccess,
    children,
}) => {
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const cancelRequest = useRequest();
    const api = useApi();

    const onCancel = () => {
        cancelRequest.onStart();

        api.cancelEvent(meetingId)
            .then((response) => {
                trackEvent(EventType.CancelMeeting, {
                    meeting_id: meetingId,
                });
                onSuccess(response.data);
                cancelRequest.onSuccess();
                setShowCancelDialog(false);
            })
            .catch((err) => {
                console.error(err);
                cancelRequest.onFailure(err);
            });
    };

    return (
        <>
            <Button variant='contained' color='error' onClick={() => setShowCancelDialog(true)}>
                {children}
            </Button>
            <Dialog
                open={showCancelDialog}
                onClose={cancelRequest.isLoading() ? undefined : () => setShowCancelDialog(false)}
            >
                <RequestSnackbar request={cancelRequest} />
                <DialogTitle>
                    {dialogTitle}
                    <IconButton
                        aria-label='close'
                        onClick={() => setShowCancelDialog(false)}
                        sx={{
                            position: 'absolute',
                            right: 10,
                            top: 8,
                        }}
                        disabled={cancelRequest.isLoading()}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>{dialogContent}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <LoadingButton onClick={onCancel} loading={cancelRequest.isLoading()}>
                        Cancel Meeting
                    </LoadingButton>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CancelMeetingButton;
