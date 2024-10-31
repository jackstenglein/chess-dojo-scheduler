import { BoardOrientation, parsePgnDate, stripTagValue, toPgnDate } from '@/api/gameApi';
import { useChess } from '@/board/pgn/PgnBoard';
import useGame from '@/context/useGame';
import { GameResult, isGameResult } from '@/database/game';
import { SaveGameDetails } from '@/hooks/useSaveGame';
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

export interface Form {
    white: string;
    black: string;
    date: DateTime | null;
    result: string;
    orientation: BoardOrientation;
    isPublishing: boolean;
}

interface SaveGameDialogueProps {
    children: React.ReactNode;
    loading: boolean;
    open: boolean;
    title: string;
    onClose: () => void;
    onSubmit: (details: SaveGameDetails & { isPublishing: boolean }) => void;
}

export default function SaveGameDialogue({
    children,
    loading,
    open,
    title,
    onClose,
    onSubmit,
}: SaveGameDialogueProps) {
    const { chess } = useChess();
    const { game } = useGame();

    const [form, setForm] = useState<Form>({
        white: '',
        black: '',
        orientation: 'white',
        result: '*',
        date: null,
        isPublishing: false,
    });
    const [errors, setErrors] = useState<Partial<FormError>>({});

    useEffect(() => {
        if (!chess || !game) {
            return;
        }

        const headers = chess.header();

        setForm((oldForm) => ({
            ...oldForm,
            white: headers.getRawValue('White'),
            black: headers.getRawValue('Black'),
            result: headers.getRawValue('Result'),
            date: parsePgnDate(headers.getRawValue('Date')),
            orientation: game.orientation ?? 'white',
        }));
    }, [chess, game]);

    function onChangeField(key: keyof Form, value: string | DateTime | null): void {
        setForm((oldForm) => ({ ...oldForm, [key]: value }));
    }

    const submit = (isPublishing: boolean) => {
        if (!game) {
            return;
        }

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

        form.isPublishing = isPublishing;

        onSubmit({
            headers: {
                ...game.headers,
                White: form.white,
                Black: form.black,
                Date: toPgnDate(form.date) ?? '????.??.??',
                Result: form.result as GameResult,
            },
            orientation: form.orientation,
            isPublishing,
        });
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
                            Review these required fields before proceeding. You can later
                            update, them in the game settings section of the editor.
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
                    data-cy='preflight-publish-button'
                    onClick={() => submit(true)}
                    loading={loading}
                >
                    Publish
                </LoadingButton>
                <LoadingButton
                    data-cy='preflight-save-button'
                    onClick={() => submit(false)}
                    loading={loading}
                >
                    Save
                </LoadingButton>
            </DialogActions>
        </Dialog>
    );
}
