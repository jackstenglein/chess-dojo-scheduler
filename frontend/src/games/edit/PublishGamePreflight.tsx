import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { GameHeader } from '../../api/gameApi';

interface FormHeader {
    white: string;
    black: string;
    date: DateTime | null;
    result: string;
}

function getFormHeader(h: GameHeader): FormHeader {
    let date = null;
    if (h.date !== '') {
        date = DateTime.fromISO(h.date.replaceAll('.', '-'));
        if (!date.isValid) {
            date = null;
        }
    }
    return {
        white: h.white,
        black: h.black,
        date,
        result: h.result,
    };
}

export function getGameHeader(h: FormHeader): GameHeader {
    let date = h.date!.toUTC().toISO()!;
    date = date.substring(0, date.indexOf('T'));
    date = date.replaceAll('-', '.');
    return {
        white: h.white,
        black: h.black,
        date,
        result: h.result,
    };
}

interface FormError {
    white: string;
    black: string;
    date: string;
    result: string;
}

interface PublishGamePreflightProps {
    open: boolean;
    onClose: () => void;
    initHeaders: GameHeader[];
    loading: boolean;
    onSubmit: (headers: GameHeader[]) => void;
}

const PublishGamePreflight: React.FC<PublishGamePreflightProps> = ({
    open,
    onClose,
    initHeaders,
    loading,
    onSubmit,
}) => {
    const multiple = initHeaders.length > 1;
    const [headers, setHeaders] = useState<FormHeader[]>(
        initHeaders.map((h) => getFormHeader(h)),
    );
    const [errors, setErrors] = useState<Record<number, FormError>>({});

    const onChangeHeader = (
        i: number,
        key: keyof GameHeader,
        value: string | DateTime | null,
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
            const error: FormError = { white: '', black: '', result: '', date: '' };
            if (h.white.trim() === '') {
                error.white = 'This field is required';
                errors[i] = error;
            }
            if (h.black.trim() === '') {
                error.black = 'This field is required';
                errors[i] = error;
            }
            if (h.result.trim() === '') {
                error.result = 'This field is required';
                errors[i] = error;
            }
            console.log('h.date: ', h.date);
            if (h.date === null || !h.date.isValid) {
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
            <DialogTitle>Almost done</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    More data is needed to publish your game.
                </DialogContentText>

                <Stack spacing={3} mt={3}>
                    {headers.map((h, i) => (
                        <Grid2 key={i} container columnSpacing={1} rowSpacing={2}>
                            {multiple && (
                                <Grid2
                                    xs={12}
                                    sm='auto'
                                    display='flex'
                                    alignItems='center'
                                >
                                    <Typography variant='caption'>
                                        Chapter {i + 1}
                                    </Typography>
                                </Grid2>
                            )}

                            <Grid2 xs={12} sm={true}>
                                <TextField
                                    fullWidth
                                    data-cy={`white-${i}`}
                                    label='White'
                                    value={h.white}
                                    onChange={(e) =>
                                        onChangeHeader(i, 'white', e.target.value)
                                    }
                                    error={!!errors[i]?.white}
                                    helperText={errors[i]?.white}
                                />
                            </Grid2>

                            <Grid2 xs={12} sm={true}>
                                <TextField
                                    fullWidth
                                    data-cy={`black-${i}`}
                                    label='Black'
                                    value={h.black}
                                    onChange={(e) =>
                                        onChangeHeader(i, 'black', e.target.value)
                                    }
                                    error={!!errors[i]?.black}
                                    helperText={errors[i]?.black}
                                />
                            </Grid2>

                            <Grid2 xs={12} sm={true}>
                                <TextField
                                    select
                                    data-cy={`result-${i}`}
                                    label='Result'
                                    value={h.result}
                                    onChange={(e) =>
                                        onChangeHeader(i, 'result', e.target.value)
                                    }
                                    error={!!errors[i]?.result}
                                    helperText={errors[i]?.result}
                                    fullWidth
                                >
                                    <MenuItem value='1-0'>White Won</MenuItem>
                                    <MenuItem value='1/2-1/2'>Draw</MenuItem>
                                    <MenuItem value='0-1'>Black Won</MenuItem>
                                </TextField>
                            </Grid2>

                            <Grid2 xs={12} sm={true}>
                                <DatePicker
                                    label='Date'
                                    disableFuture
                                    value={h.date}
                                    onChange={(newValue) => {
                                        onChangeHeader(i, 'date', newValue);
                                    }}
                                    slotProps={{
                                        textField: {
                                            id: `date-${i}`,
                                            error: !!errors[i]?.date,
                                            helperText: errors[i]?.date,
                                            fullWidth: true,
                                        },
                                    }}
                                />
                            </Grid2>
                        </Grid2>
                    ))}
                </Stack>
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

export default PublishGamePreflight;