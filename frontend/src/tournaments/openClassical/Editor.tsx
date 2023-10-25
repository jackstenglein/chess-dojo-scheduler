import { useState } from 'react';

import { OpenClassical } from '../../database/tournament';
import { useAuth } from '../../auth/Auth';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    MenuItem,
    Stack,
} from '@mui/material';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { LoadingButton } from '@mui/lab';
import { useApi } from '../../api/Api';

interface EditorProps {
    openClassical?: OpenClassical;
    onSuccess: (openClassical: OpenClassical) => void;
}

const Editor: React.FC<EditorProps> = ({ openClassical, onSuccess }) => {
    const user = useAuth().user;
    const [open, setOpen] = useState(false);

    const maxRound = (openClassical?.rounds?.length || 0) + 1;
    const [round, setRound] = useState(maxRound);
    const [pgnData, setPgnData] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const request = useRequest();
    const api = useApi();

    if (!openClassical || !user) {
        return null;
    }
    if (!user.isAdmin && !user.isTournamentAdmin) {
        return null;
    }

    const handleClose = () => setOpen(false);

    const onSave = () => {
        const newErrors: Record<string, string> = {};

        if (!round) {
            newErrors.round = 'This field is required';
        }
        if (!pgnData.trim()) {
            newErrors.pgnData = 'This field is required';
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        request.onStart();
        api.putOpenClassicalPairings(round, pgnData)
            .then((resp) => {
                console.log('putOpenClassicalPairings: ', resp);
                request.onSuccess(resp.data);
                onSuccess(resp.data);
                handleClose();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <Button
                variant='contained'
                sx={{ mt: 1, mb: 3 }}
                onClick={() => setOpen(true)}
            >
                Edit Tournament
            </Button>
            <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
                <DialogTitle>Edit Tournament</DialogTitle>
                <DialogContent>
                    <Stack pt={1} spacing={3}>
                        <TextField
                            select
                            label='Round'
                            fullWidth
                            value={round}
                            onChange={(e) => setRound(parseInt(e.target.value))}
                            error={!!errors.round}
                            helperText={errors.round}
                        >
                            {Array(maxRound)
                                .fill(0)
                                .map((_, i) => (
                                    <MenuItem key={i + 1} value={`${i + 1}`}>
                                        {i + 1}
                                    </MenuItem>
                                ))}
                        </TextField>

                        <TextField
                            label='PGN'
                            multiline
                            minRows={3}
                            maxRows={15}
                            value={pgnData}
                            onChange={(e) => setPgnData(e.target.value)}
                            error={!!errors.pgnData}
                            helperText={errors.pgnData}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <LoadingButton loading={request.isLoading()} onClick={onSave}>
                        Save
                    </LoadingButton>
                </DialogActions>

                <RequestSnackbar request={request} />
            </Dialog>
        </>
    );
};

export default Editor;
