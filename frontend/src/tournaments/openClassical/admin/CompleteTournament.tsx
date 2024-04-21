import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { useState } from 'react';
import { useApi } from '../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../api/Request';
import { OpenClassical } from '../../../database/tournament';

interface CompleteTournamentProps {
    openClassical?: OpenClassical;
    onSuccess: (v: OpenClassical) => void;
}

const CompleteTournament: React.FC<CompleteTournamentProps> = ({
    openClassical,
    onSuccess,
}) => {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | null>(null);
    const request = useRequest();
    const api = useApi();

    const onComplete = () => {
        if (!date) {
            return;
        }

        request.onStart();
        api.adminCompleteTournament(date.toISOString())
            .then((resp) => {
                console.log('adminCompleteTournament: ', resp);
                request.onSuccess();
                onSuccess(resp.data);
                setOpen(false);
            })
            .catch((err) => {
                console.error('adminCompleteTournament: ', err);
                request.onFailure(err);
            });
    };

    if (!openClassical || openClassical.acceptingRegistrations) {
        return null;
    }

    return (
        <>
            <Button variant='contained' color='error' onClick={() => setOpen(true)}>
                Complete Tournament
            </Button>
            <Dialog
                open={open}
                onClose={request.isLoading() ? undefined : () => setOpen(false)}
                maxWidth='sm'
                fullWidth
            >
                <DialogTitle>Complete Tournament?</DialogTitle>
                <DialogContent>
                    <Stack spacing={3}>
                        <DialogContentText>
                            This will move the current tournament results to the Previous
                            Tournaments Page and create a new tournament with open
                            registrations. This action cannot be undone.
                        </DialogContentText>

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label='Next Tournament Start Date'
                                value={date}
                                onChange={(newValue) => setDate(newValue)}
                            />
                        </LocalizationProvider>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} disabled={request.isLoading()}>
                        Cancel
                    </Button>
                    <LoadingButton
                        loading={request.isLoading()}
                        color='error'
                        onClick={onComplete}
                        disabled={date === null}
                    >
                        Complete Tournament
                    </LoadingButton>
                </DialogActions>

                <RequestSnackbar request={request} />
            </Dialog>
        </>
    );
};

export default CompleteTournament;
