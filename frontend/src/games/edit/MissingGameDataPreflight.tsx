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
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { GameHeader, parsePgnDate, stripTagValue, toPgnDate } from '../../api/gameApi';
import { GameResult, PgnHeaders, isGameResult } from '../../database/game';

interface FormHeader {
    white: string;
    black: string;
    date: DateTime | null;
    result: string;
}

function getFormHeader(h?: PgnHeaders): FormHeader {
    let result = h?.Result ?? '';
    if (!isGameResult(result)) {
        result = '';
    }

    return {
        result,
        date: parsePgnDate(h?.Date),
        white: stripTagValue(h?.White || ''),
        black: stripTagValue(h?.Black || ''),
    };
}

export function getGameHeaders(h: FormHeader): GameHeader {
    return {
        date: toPgnDate(h.date) ?? '',
        white: h.white,
        black: h.black,
        result: h.result,
    };
}

interface FormError {
    white: string;
    black: string;
    date: string;
    result: string;
}

interface MissingGameDataPreflightProps {
    open: boolean;
    onClose: () => void;
    initHeaders?: PgnHeaders;
    loading: boolean;
    title?: string;
    skippable?: boolean;
    children?: React.ReactNode;
    onSubmit: (headers: GameHeader) => void;
}

type PublishGamePreflightProps = Omit<MissingGameDataPreflightProps, 'children'>;

export const PublishGamePreflight: React.FC<MissingGameDataPreflightProps> = (
    props: PublishGamePreflightProps,
) => (
    <MissingGameDataPreflight {...props}>
        Your game is missing data. Please fill out these fields to publish your analysis.
    </MissingGameDataPreflight>
);
export const MissingGameDataPreflight = ({
    open,
    onClose,
    initHeaders,
    loading,
    skippable,
    title,
    children,
    onSubmit,
}: MissingGameDataPreflightProps) => {
    const [headers, setHeaders] = useState<FormHeader>(getFormHeader(initHeaders));
    const [errors, setErrors] = useState<Partial<FormError>>({});

    if (skippable === undefined) {
        skippable = false;
    }

    if (title === undefined) {
        title = 'Missing Data';
    }

    useEffect(() => {
        setHeaders(getFormHeader(initHeaders));
    }, [initHeaders]);

    const onChangeHeader = (key: keyof GameHeader, value: string | DateTime | null) => {
        setHeaders((oldHeaders) => ({ ...oldHeaders, [key]: value }));
    };

    const submit = () => {
        const newErrors: Partial<FormError> = {};

        if (!skippable) {
            if (stripTagValue(headers.white) === '') {
                newErrors.white = 'This field is required';
            }
            if (stripTagValue(headers.black) === '') {
                newErrors.black = 'This field is required';
            }
            if (!isGameResult(headers.result)) {
                newErrors.result = 'This field is required';
            }
            if (headers.date === null || !headers.date.isValid) {
                newErrors.date = 'This field is required';
            }
        }

        setErrors(newErrors);
        if (Object.values(newErrors).length > 0) {
            return;
        }

        onSubmit(getGameHeaders(headers));
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth='lg'>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {children && <DialogContentText>{children}</DialogContentText>}

                <Stack spacing={3} mt={3}>
                    <Grid2 container columnSpacing={1} rowSpacing={2}>
                        <Grid2 xs={12} sm={true}>
                            <TextField
                                fullWidth
                                data-cy='white'
                                label="White's name"
                                value={headers.white}
                                onChange={(e) => onChangeHeader('white', e.target.value)}
                                error={!!errors.white}
                                helperText={errors.white}
                            />
                        </Grid2>

                        <Grid2 xs={12} sm={true}>
                            <TextField
                                fullWidth
                                data-cy='black'
                                label="Black's name"
                                value={headers.black}
                                onChange={(e) => onChangeHeader('black', e.target.value)}
                                error={!!errors.black}
                                helperText={errors.black}
                            />
                        </Grid2>

                        <Grid2 xs={12} sm={true}>
                            <TextField
                                select
                                data-cy='result'
                                label='Game Result'
                                value={headers.result}
                                onChange={(e) => onChangeHeader('result', e.target.value)}
                                error={!!errors.result}
                                helperText={errors.result}
                                fullWidth
                            >
                                <MenuItem value={GameResult.White}>White Won</MenuItem>
                                <MenuItem value={GameResult.Draw}>Draw</MenuItem>
                                <MenuItem value={GameResult.Black}>Black Won</MenuItem>
                            </TextField>
                        </Grid2>

                        <Grid2 xs={12} sm={true}>
                            <DatePicker
                                label='Date'
                                disableFuture
                                value={headers.date}
                                onChange={(newValue) => {
                                    onChangeHeader('date', newValue);
                                }}
                                slotProps={{
                                    textField: {
                                        id: 'date',
                                        error: !!errors.date,
                                        helperText: errors.date,
                                        fullWidth: true,
                                    },
                                    field: {
                                        clearable: true,
                                    },
                                }}
                            />
                        </Grid2>
                    </Grid2>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    {skippable ? 'Skip for now' : 'Cancel'}
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
