import { useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { GameHeader } from '../../api/gameApi';
import { LoadingButton } from '@mui/lab';

interface FormHeader {
    white: string;
    black: string;
    date: Date | null;
}

function getFormHeader(h: GameHeader): FormHeader {
    let date = null;
    if (h.date !== '') {
        date = new Date(h.date);
        if (isNaN(date.getTime())) {
            date = null;
        }
    }
    return {
        white: h.white,
        black: h.black,
        date,
    };
}

function getGameHeader(h: FormHeader): GameHeader {
    let date = h.date!.toISOString();
    date = date.substring(0, date.indexOf('T'));
    date = date.replaceAll('-', '.');
    return {
        white: h.white,
        black: h.black,
        date,
    };
}

interface FormError {
    white: string;
    black: string;
    date: string;
}

interface SubmitGamePreflightProps {
    open: boolean;
    onClose: () => void;
    initHeaders: GameHeader[];
    loading: boolean;
    onSubmit: (headers: GameHeader[]) => void;
}

const SubmitGamePreflight: React.FC<SubmitGamePreflightProps> = ({
    open,
    onClose,
    initHeaders,
    loading,
    onSubmit,
}) => {
    const multiple = initHeaders.length > 1;
    const [headers, setHeaders] = useState<FormHeader[]>(
        initHeaders.map((h) => getFormHeader(h))
    );
    const [errors, setErrors] = useState<Record<number, FormError>>({});

    const onChangeHeader = (
        i: number,
        key: keyof GameHeader,
        value: string | Date | null
    ) => {
        setHeaders([
            ...headers.slice(0, i),
            {
                ...headers[i],
                [key]: value,
            },
            ...headers.slice(i + 1),
        ]);
    };

    const submit = () => {
        let errors: Record<number, FormError> = {};
        headers.forEach((h, i) => {
            const error: FormError = { white: '', black: '', date: '' };
            if (h.white.trim() === '') {
                error.white = 'This field is required';
                errors[i] = error;
            }
            if (h.black.trim() === '') {
                error.black = 'This field is required';
                errors[i] = error;
            }
            if (h.date === null || isNaN(h.date.getTime())) {
                error.date = 'This field is required';
                errors[i] = error;
            }
        });
        setErrors(errors);

        if (Object.values(errors).length > 0) {
            return;
        }

        const gameHeaders = headers.map((h) => getGameHeader(h));
        onSubmit(gameHeaders);
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth='lg'>
            <DialogTitle></DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {multiple
                        ? 'Some of your PGNs are missing data. Please fill out the following fields to finish creating your games.'
                        : 'Your PGN is missing data. Please fill out the following fields to finish creating your game.'}
                </DialogContentText>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Stack spacing={3} mt={3}>
                        {headers.map((h, i) => (
                            <Stack
                                key={i}
                                direction='row'
                                spacing={1}
                                alignItems='baseline'
                                justifyContent='space-between'
                            >
                                {multiple && (
                                    <Typography variant='caption'>
                                        Chapter {i + 1}
                                    </Typography>
                                )}

                                <TextField
                                    data-cy={`white-${i}`}
                                    label='White'
                                    value={h.white}
                                    onChange={(e) =>
                                        onChangeHeader(i, 'white', e.target.value)
                                    }
                                    error={errors[i] && !!errors[i].white}
                                    helperText={(errors[i] && errors[i].white) || ' '}
                                />

                                <TextField
                                    data-cy={`black-${i}`}
                                    label='Black'
                                    value={h.black}
                                    onChange={(e) =>
                                        onChangeHeader(i, 'black', e.target.value)
                                    }
                                    error={errors[i] && !!errors[i].black}
                                    helperText={(errors[i] && errors[i].black) || ' '}
                                />

                                <DatePicker
                                    label='Date'
                                    value={h.date}
                                    onChange={(newValue) => {
                                        onChangeHeader(i, 'date', newValue);
                                    }}
                                    slotProps={{
                                        textField: {
                                            id: `date-${i}`,
                                            error: errors[i] && !!errors[i].date,
                                            helperText:
                                                (errors[i] && errors[i].date) || ' ',
                                        },
                                    }}
                                />
                            </Stack>
                        ))}
                    </Stack>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <LoadingButton
                    data-cy='submit-preflight'
                    onClick={submit}
                    loading={loading}
                >
                    Submit
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
};

export default SubmitGamePreflight;
