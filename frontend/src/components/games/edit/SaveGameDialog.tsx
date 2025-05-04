import { parsePgnDate, stripTagValue } from '@/api/gameApi';
import { useFreeTier } from '@/auth/Auth';
import { useChess } from '@/board/pgn/PgnBoard';
import { GameResult, isGameResult } from '@/database/game';
import { GameOrientations } from '@jackstenglein/chess-dojo-common/src/database/game';
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
    Grid,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTime } from 'luxon';
import { ReactNode, useState } from 'react';

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
    publish?: boolean;
}

export enum SaveGameDialogType {
    Save = 'save',
    Publish = 'publish',
}

interface SaveGameDialogProps {
    type: SaveGameDialogType;
    children?: React.ReactNode;
    loading?: boolean;
    open: boolean;
    title: string;
    onClose: () => void;
    onSubmit: (details: SaveGameForm) => Promise<void>;
}

export default function SaveGameDialog({
    type,
    children,
    loading,
    open,
    title,
    onClose,
    onSubmit,
}: SaveGameDialogProps) {
    const isFreeTier = useFreeTier();
    const { chess, orientation: initialOrientation } = useChess();
    const initialTags = chess?.pgn.header.tags;

    const [selectedButton, setSelectedButton] = useState('');
    const [form, setForm] = useState<SaveGameForm>({
        white: initialTags?.White ?? '',
        black: initialTags?.Black ?? '',
        result: initialTags?.Result ?? '',
        date: parsePgnDate(initialTags?.Date?.value),
        orientation: initialOrientation ?? GameOrientations.white,
    });
    const [errors, setErrors] = useState<Partial<FormError>>({});

    function onChangeField(key: keyof SaveGameForm, value: string | DateTime | null): void {
        setForm((oldForm) => ({ ...oldForm, [key]: value }));
    }

    const submit = (publish?: boolean) => {
        const newErrors: Partial<FormError> = {};

        if (publish) {
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
        } else if (form.date && !form.date.isValid) {
            newErrors.date = 'Invalid date';
        }

        setErrors(newErrors);
        if (Object.values(newErrors).length > 0) {
            return;
        }

        setSelectedButton(publish ? 'publish' : 'save');
        void onSubmit({ ...form, publish }).then(() => setSelectedButton(''));
    };

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth='md'>
            <SaveGameDialogBody
                title={title}
                form={form}
                onChangeField={onChangeField}
                errors={errors}
            >
                {children}
            </SaveGameDialogBody>
            <DialogActions>
                <Button data-cy='cancel-preflight' onClick={onClose} disabled={loading}>
                    Cancel
                </Button>

                {type === SaveGameDialogType.Save && (
                    <LoadingButton
                        data-cy='save-dialogue-button'
                        onClick={() => submit(false)}
                        loading={loading && selectedButton === 'save'}
                        disabled={loading && selectedButton !== 'save'}
                    >
                        Save
                    </LoadingButton>
                )}

                {type === SaveGameDialogType.Save && isFreeTier ? (
                    <Tooltip title='Free users are not able to publish games. Upgrade to publish your game.'>
                        <span>
                            <Button disabled>Save & Publish</Button>
                        </span>
                    </Tooltip>
                ) : (
                    <LoadingButton
                        data-cy='publish-dialogue-button'
                        onClick={() => submit(true)}
                        loading={loading && selectedButton === 'publish'}
                        disabled={loading && selectedButton !== 'publish'}
                    >
                        {type === SaveGameDialogType.Save ? 'Save & Publish' : 'Publish'}
                    </LoadingButton>
                )}
            </DialogActions>
        </Dialog>
    );
}

function SaveGameDialogBody({
    title,
    children,
    form,
    onChangeField,
    errors,
}: {
    title: string;
    children?: ReactNode;
    form: SaveGameForm;
    onChangeField: (key: keyof SaveGameForm, value: string | DateTime | null) => void;
    errors: Partial<FormError>;
}) {
    return (
        <>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {children ? (
                        children
                    ) : (
                        <>
                            Review these fields before proceeding. You can update them later in the
                            game settings section of the editor.
                        </>
                    )}
                </DialogContentText>

                <Stack spacing={3} mt={3}>
                    <Grid container columnSpacing={1} rowSpacing={2}>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 'grow',
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
                        </Grid>

                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 'grow',
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
                        </Grid>

                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 2,
                            }}
                        >
                            <TextField
                                select
                                data-cy='result'
                                label='Result'
                                value={form.result}
                                onChange={(e) => onChangeField('result', e.target.value)}
                                error={!!errors.result}
                                helperText={errors.result}
                                fullWidth
                            >
                                <MenuItem value={GameResult.White}>White Won</MenuItem>
                                <MenuItem value={GameResult.Draw}>Draw</MenuItem>
                                <MenuItem value={GameResult.Black}>Black Won</MenuItem>
                                <MenuItem value={GameResult.Incomplete}>Analysis</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 3,
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
                                }}
                            />
                        </Grid>

                        <Grid size={12}>
                            <FormControl>
                                <FormLabel>Default Orientation</FormLabel>
                                <RadioGroup
                                    row
                                    value={form.orientation}
                                    onChange={(e) => onChangeField('orientation', e.target.value)}
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
                        </Grid>
                    </Grid>
                </Stack>
            </DialogContent>
        </>
    );
}
