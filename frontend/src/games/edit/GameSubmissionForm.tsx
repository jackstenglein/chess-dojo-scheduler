import { useState } from 'react';
import {
    Container,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { CreateGameRequest, GameSubmissionType } from '../../api/gameApi';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getGameHeader } from './SubmitGamePreflight';
import { useFreeTier } from '../../auth/Auth';

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

interface GameSubmissionFormProps {
    title: string;
    description?: string;
    loading: boolean;
    isCreating: boolean;
    onSubmit: (req: CreateGameRequest) => void;
}

const GameSubmissionForm: React.FC<GameSubmissionFormProps> = ({
    title,
    description,
    loading,
    isCreating,
    onSubmit,
}) => {
    const isFreeTier = useFreeTier();

    const [type, setType] = useState<GameSubmissionType>(
        GameSubmissionType.LichessChapter
    );
    const [lichessUrl, setLichessUrl] = useState('');
    const [pgnText, setPgnText] = useState('');
    const [white, setWhite] = useState('');
    const [black, setBlack] = useState('');
    const [date, setDate] = useState<Date | null>(null);
    const [result, setResult] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [orientation, setOrientation] = useState('white');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = () => {
        const errors: Record<string, string> = {};
        if (
            type === GameSubmissionType.LichessChapter &&
            !lichessChapterRegex.test(lichessUrl)
        ) {
            errors.lichessUrl = 'Does not match the Lichess chapter URL format';
        } else if (
            type === GameSubmissionType.LichessStudy &&
            !lichessStudyRegex.test(lichessUrl)
        ) {
            errors.lichessUrl = 'Does not match the Lichess study URL format';
        } else if (type === GameSubmissionType.Manual && pgnText.trim() === '') {
            errors.pgnText = 'This field is required';
        }

        let unlisted = visibility === 'unlisted';
        if (isFreeTier) {
            unlisted = true;
        }
        if (type === GameSubmissionType.StartingPosition) {
            unlisted = true;

            if (white.trim() === '') {
                errors.white = 'This field is required';
            }
            if (black.trim() === '') {
                errors.black = 'This field is required';
            }
            if (!date || isNaN(date.getTime())) {
                errors.date = 'This field is required';
            }
            if (result.trim() === '') {
                errors.result = 'This field is required';
            }
        }

        setErrors(errors);
        if (Object.entries(errors).length > 0) {
            return;
        }

        onSubmit({
            type,
            url:
                type === GameSubmissionType.LichessChapter ||
                type === GameSubmissionType.LichessStudy
                    ? lichessUrl
                    : undefined,
            pgnText: type === GameSubmissionType.Manual ? pgnText : undefined,
            orientation,
            headers:
                type === GameSubmissionType.StartingPosition
                    ? [getGameHeader({ white, black, date, result })]
                    : undefined,
            unlisted,
        });
    };

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <Stack spacing={2}>
                <Typography variant='h6'>{title}</Typography>
                {description && <Typography variant='body1'>{description}</Typography>}

                <FormControl>
                    <RadioGroup
                        value={type}
                        onChange={(e, v) => setType(v as GameSubmissionType)}
                    >
                        <FormControlLabel
                            value={GameSubmissionType.LichessChapter}
                            control={<Radio />}
                            label='Import from Lichess Study (Single Chapter Only)'
                        />
                        {isCreating && (
                            <FormControlLabel
                                value={GameSubmissionType.LichessStudy}
                                control={<Radio />}
                                label='Bulk Import from Lichess Study (All Chapters)'
                            />
                        )}
                        <FormControlLabel
                            value={GameSubmissionType.Manual}
                            control={<Radio />}
                            label='Paste PGN'
                        />
                        <FormControlLabel
                            value={GameSubmissionType.StartingPosition}
                            control={<Radio />}
                            label='Starting Position (Empty PGN)'
                        />
                    </RadioGroup>
                </FormControl>

                {type === GameSubmissionType.LichessChapter && (
                    <TextField
                        data-cy='lichess-chapter-url'
                        label='Lichess Chapter URL'
                        placeholder='https://lichess.org/study/abcd1234/abcd1234'
                        value={lichessUrl}
                        onChange={(e) => setLichessUrl(e.target.value)}
                        error={!!errors.lichessUrl}
                        helperText={
                            errors.lichessUrl ||
                            'Your Lichess study must be unlisted or public. Paste "Current chapter URL" from Lichess.'
                        }
                    />
                )}

                {type === GameSubmissionType.LichessStudy && (
                    <TextField
                        data-cy='lichess-study-url'
                        label='Lichess Study URL'
                        placeholder='https://lichess.org/study/abcd1234'
                        value={lichessUrl}
                        onChange={(e) => setLichessUrl(e.target.value)}
                        error={!!errors.lichessUrl}
                        helperText={
                            errors.lichessUrl ||
                            'Your Lichess study must be unlisted or public. Paste "Study URL" from Lichess.'
                        }
                    />
                )}

                {type === GameSubmissionType.Manual && (
                    <TextField
                        data-cy='pgn-text'
                        label='PGN Text'
                        placeholder={pgnTextPlaceholder}
                        value={pgnText}
                        onChange={(e) => setPgnText(e.target.value)}
                        multiline
                        minRows={5}
                        error={!!errors.pgnText}
                        helperText={errors.pgnText}
                    />
                )}

                {type === GameSubmissionType.StartingPosition && (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                )}

                <FormControl sx={{ pt: 3 }} disabled={isFreeTier}>
                    <FormLabel>Visibility</FormLabel>
                    <RadioGroup
                        row
                        value={
                            isFreeTier || type === GameSubmissionType.StartingPosition
                                ? 'unlisted'
                                : visibility
                        }
                        onChange={(e) => setVisibility(e.target.value)}
                    >
                        <FormControlLabel
                            value='public'
                            control={
                                <Radio
                                    disabled={
                                        isFreeTier ||
                                        type === GameSubmissionType.StartingPosition
                                    }
                                />
                            }
                            label='Public'
                        />
                        <FormControlLabel
                            value='unlisted'
                            control={
                                <Radio
                                    disabled={
                                        isFreeTier ||
                                        type === GameSubmissionType.StartingPosition
                                    }
                                />
                            }
                            label='Unlisted'
                        />
                    </RadioGroup>
                    <FormHelperText>
                        {isFreeTier &&
                            'Free-tier members can only submit unlisted games. '}
                        Unlisted games are not indexed in the position database, do not
                        show up on the search page and are not visible to others on your
                        profile. However, you can still share them with the direct link.
                        This allows you to share your annotations with others for feedback
                        before publishing them to the entire Dojo. Empty PGNs are required
                        to start as unlisted because they have no annotations.
                    </FormHelperText>
                </FormControl>

                <FormControl sx={{ pt: 1, pb: 3 }}>
                    <FormLabel>Board Orientation</FormLabel>
                    <RadioGroup
                        row
                        value={orientation}
                        onChange={(e, v) => setOrientation(v)}
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

                <LoadingButton
                    data-cy='submit'
                    variant='contained'
                    loading={loading}
                    onClick={handleSubmit}
                >
                    Submit
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default GameSubmissionForm;
