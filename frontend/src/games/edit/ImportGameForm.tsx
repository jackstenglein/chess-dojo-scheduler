import { LoadingButton } from '@mui/lab';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

import { Box, MenuItem, Stack, TextField } from '@mui/material';

import { DateTime } from 'luxon';
import { useState } from 'react';

import { GameHeader, GameSubmissionType } from '../../api/gameApi';
import { getGameHeader } from './SubmitGamePreflight';

const lichessStudyRegex = new RegExp('^https://lichess.org/study/.{8}$');
const lichessChapterRegex = new RegExp('^https://lichess.org/study/.{8}/.{8}$');

const pgnTextPlaceholder = `[Event "Classical game"]
[Site "https://lichess.org"]
[Date "2023.01.24"]
[White "MyUsername"]
[Black "OpponentUsername"]
[Result "1-0"]
[WhiteElo "1669"]
[BlackElo "1983"]

{ Before the game, I did some quick prep and saw that my opponent plays the Sicilian. I usually play the Alapin against the Sicilian and didn't see any reason to change that, so I rewatched a GothamChess video on the opening right before the game. }
1. e4 { [%clk 1:30:00] } 1... c5 { [%clk 1:30:00] } 2. c3 { [%clk 1:30:21] } 2... Nf6 { [%clk 1:30:18] }`;

export interface RemoteGame {
    url?: string;
    pgnText?: string;
    headers?: GameHeader[];
<<<<<<< HEAD
    type: GameSubmissionType;
=======
    type?: GameSubmissionType;
>>>>>>> 0e0687d (feat: game submission form facelift)
}

interface ImportGameFormProps {
    loading: boolean;
    onSubmit: (game: RemoteGame) => void;
}

export const OnlineGameForm: React.FC<ImportGameFormProps> = ({ loading, onSubmit }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        let submissionType: GameSubmissionType | null = null;

        if (lichessChapterRegex.test(url)) {
            submissionType = GameSubmissionType.LichessChapter;
        } else if (lichessStudyRegex.test(url)) {
            submissionType = GameSubmissionType.LichessStudy;
        }

        if (submissionType !== null) {
            onSubmit({ url, type: submissionType });
            return;
        }

        setError(
            'The URL provided does not match that of an unlisted or public Lichess study or game.',
        );
    };

    return (
        <Box display='flex' gap={1}>
            <TextField
                sx={{ flexGrow: 1 }}
                data-cy='url'
                label='Lichess or Chess.com URL'
                placeholder='https://lichess.org/study/abcd1234/abcd1234'
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                error={!!error}
                helperText={error}
            />
            <LoadingButton
                data-cy='submit'
                variant='contained'
                loading={loading}
                onClick={handleSubmit}
            >
                Submit
            </LoadingButton>
        </Box>
    );
};

export const StartingPositionForm: React.FC<ImportGameFormProps> = ({
    loading,
    onSubmit,
}) => {
    const [white, setWhite] = useState('');
    const [black, setBlack] = useState('');
    const [date, setDate] = useState<DateTime | null>(null);
    const [result, setResult] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};

        if (white.trim() === '') {
            newErrors.white = 'This field is required';
        }

        if (black.trim() === '') {
            newErrors.black = 'This field is required';
        }

        if (!date || !date.isValid) {
            newErrors.date = 'This field is required';
        }

        if (result.trim() === '') {
            newErrors.result = 'This field is required';
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        onSubmit({
            type: GameSubmissionType.StartingPosition,
            headers: [getGameHeader({ white, black, date, result })],
        });
    };

    return (
        <Stack alignItems='flex-end' spacing={2}>
            <LocalizationProvider
                dateAdapter={AdapterLuxon}
                adapterLocale={navigator.languages?.[0]}
            >
                <Stack
                    direction='row'
                    spacing={1}
                    alignItems='baseline'
                    justifyContent='space-between'
                >
                    <TextField
                        fullWidth
                        data-cy={`white`}
                        label='White'
                        value={white}
                        onChange={(e) => setWhite(e.target.value)}
                        error={!!errors.white}
                        helperText={errors.white}
                    />

                    <TextField
                        fullWidth
                        data-cy={`black`}
                        label='Black'
                        value={black}
                        onChange={(e) => setBlack(e.target.value)}
                        error={!!errors.black}
                        helperText={errors.black}
                    />

                    <TextField
                        fullWidth
                        select
                        data-cy={`result`}
                        label='Result'
                        value={result}
                        onChange={(e) => setResult(e.target.value)}
                        error={!!errors.result}
                        helperText={errors.result}
                    >
                        <MenuItem value='1-0'>White Won</MenuItem>
                        <MenuItem value='1/2-1/2'>Draw</MenuItem>
                        <MenuItem value='0-1'>Black Won</MenuItem>
                    </TextField>

                    <DatePicker
                        label='Date'
                        disableFuture
                        value={date}
                        onChange={(newValue) => setDate(newValue)}
                        slotProps={{
                            textField: {
                                id: `date`,
                                error: !!errors.date,
                                helperText: errors.date,
                                fullWidth: true,
                            },
                        }}
                    />
                </Stack>
            </LocalizationProvider>
            <LoadingButton
                data-cy='submit'
                variant='contained'
                loading={loading}
                onClick={handleSubmit}
            >
                Submit
            </LoadingButton>
        </Stack>
    );
};

export const PGNForm: React.FC<ImportGameFormProps> = ({ onSubmit, loading }) => {
    const [pgnText, setPgnText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        let newError = null;

        if (pgnText.trim() === '') {
            newError = 'This field is required';
        }

        setError(newError);
        if (newError) {
            return;
        }

<<<<<<< HEAD
        onSubmit({
            pgnText,
            type: GameSubmissionType.Manual,
        });
=======
        onSubmit({ pgnText });
>>>>>>> 0e0687d (feat: game submission form facelift)
    };

    return (
        <Stack spacing={2}>
            <TextField
                data-cy='pgn-text'
                label='PGN Text'
                placeholder={pgnTextPlaceholder}
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                multiline
                minRows={5}
                error={!!error}
                helperText={error}
            />
            <LoadingButton
                sx={{ alignSelf: 'flex-end' }}
                data-cy='submit'
                variant='contained'
                loading={loading}
                onClick={handleSubmit}
            >
                Submit
            </LoadingButton>
        </Stack>
    );
};
