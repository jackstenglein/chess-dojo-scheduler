import { parsePgnDate, stripTagValue } from '@/api/gameApi';
import { useChess } from '@/board/pgn/PgnBoard';
import { GameResult, isGameResult } from '@/database/game';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    Grid2,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

interface FormError {
    white: string;
    black: string;
    date: string;
    result: string;
}

export interface SaveGameForm {
    white: string;
    black: string;
    date: DateTime | null;
    result: string;
    orientation: 'white' | 'black';
}

interface SaveGameDialogueProps {
    children?: React.ReactNode;
    loading?: boolean;
    open: boolean;
    title: string;
    onClose: () => void;
    onSubmit: (details: SaveGameForm) => void;
}

export default function SaveGameDialogue({
    children,
    loading,
    open,
    title,
    onClose,
    onSubmit,
}: SaveGameDialogueProps) {
    const { chess, orientation: initialOrientation } = useChess();

    const [form, setForm] = useState<SaveGameForm>({
        white: '',
        black: '',
        orientation: 'white',
        result: '*',
        date: null,
    });
    const [errors, setErrors] = useState<Partial<FormError>>({});
    const initialTags = chess?.pgn.header.tags;

    useEffect(() => {
        setForm((oldForm) => ({
            ...oldForm,
            white: initialTags?.White ?? '',
            black: initialTags?.Black ?? '',
            result: initialTags?.Result ?? '*',
            date: parsePgnDate(initialTags?.Date?.value),
            orientation: initialOrientation ?? 'white',
        }));
    }, [initialTags, initialOrientation]);

    function onChangeField(
        key: keyof SaveGameForm,
        value: string | DateTime | null,
    ): void {
        setForm((oldForm) => ({ ...oldForm, [key]: value }));
    }

    const submit = () => {
        const newErrors: Partial<FormError> = {};

        if (stripTagValue(form.white) === '') {
            newErrors.white = 'This field is required';
        }
        if (stripTagValue(form.black) === '') {
            newErrors.black = 'This field is required';
        }
        if (!isGameResult(form.result)) {
            newErrors.result = 'This field is required';
        }
        if (!form.date?.isValid) {
            newErrors.date = 'This field is required';
        }

        setErrors(newErrors);
        if (Object.values(newErrors).length > 0) {
            return;
        }

        onSubmit(form);
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth='lg'>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {children ? (
                        children
                    ) : (
                        <>
                            Review these fields before proceeding. You can update them
                            later in the game settings section of the editor.
                        </>
                    )}
                </DialogContentText>

                <Stack spacing={3} mt={3}>
                    <Grid2 container columnSpacing={1} rowSpacing={2}>
                        <Grid2
                            size={{
                                xs: 12,
                                sm: 'grow',
                            }}
                        >
                            <TextField
                                fullWidth
                                data-cy='white'
                                label="White's name"
                                value={form.white}
                                onChange={(e) => onChangeField('white', e.target.value)}
                                error={!!errors.white}
                                helperText={errors.white}
                            />
                        </Grid2>

                        <Grid2
                            size={{
                                xs: 12,
                                sm: 'grow',
                            }}
                        >
                            <TextField
                                fullWidth
                                data-cy='black'
                                label="Black's name"
                                value={form.black}
                                onChange={(e) => onChangeField('black', e.target.value)}
                                error={!!errors.black}
                                helperText={errors.black}
                            />
                        </Grid2>

                        <Grid2
                            size={{
                                xs: 12,
                                sm: 'grow',
                            }}
                        >
                            <TextField
                                select
                                data-cy='result'
                                label='Game Result'
                                value={form.result.replaceAll('*', '')}
                                onChange={(e) => onChangeField('result', e.target.value)}
                                error={!!errors.result}
                                helperText={errors.result}
                                fullWidth
                            >
                                <MenuItem value={GameResult.White}>White Won</MenuItem>
                                <MenuItem value={GameResult.Draw}>Draw</MenuItem>
                                <MenuItem value={GameResult.Black}>Black Won</MenuItem>
                            </TextField>
                        </Grid2>

                        <Grid2
                            size={{
                                xs: 12,
                                sm: 'grow',
                            }}
                        >
                            <DatePicker
                                label='Date'
                                disableFuture
                                value={form.date}
                                onChange={(newValue) => {
                                    onChangeField('date', newValue);
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

                        <Grid2 size={12}>
                            <FormControl>
                                <FormLabel>Default Orientation</FormLabel>
                                <RadioGroup
                                    row
                                    value={form.orientation}
                                    onChange={(e) =>
                                        onChangeField('orientation', e.target.value)
                                    }
                                >
                                    <FormControlLabel
                                        value='white'
                                        control={<Radio />}
                                        label='White'
                                    />
                                    <FormControlLabel
                                        value='black'
                                        control={<Radio />}
                                        label='Black'
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid2>
                    </Grid2>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button data-cy='cancel-preflight' onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <LoadingButton
                    data-cy='save-dialogue-button'
                    onClick={() => submit()}
                    loading={loading}
                >
                    Submit
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}
