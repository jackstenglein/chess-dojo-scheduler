import { useState } from 'react';
import {
    Container,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { CreateGameRequest } from '../../api/gameApi';

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

enum SubmissionType {
    LichessChapter = 'lichessChapter',
    LichessStudy = 'lichessStudy',
    Manual = 'manual',
}

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
    const [type, setType] = useState<SubmissionType>(SubmissionType.LichessChapter);
    const [lichessUrl, setLichessUrl] = useState('');
    const [pgnText, setPgnText] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = () => {
        const errors: Record<string, string> = {};
        if (
            type === SubmissionType.LichessChapter &&
            !lichessChapterRegex.test(lichessUrl)
        ) {
            errors.lichessUrl = 'Does not match the Lichess chapter URL format';
        } else if (
            type === SubmissionType.LichessStudy &&
            !lichessStudyRegex.test(lichessUrl)
        ) {
            errors.lichessUrl = 'Does not match the Lichess study URL format';
        } else if (type === SubmissionType.Manual && pgnText === '') {
            errors.pgnText = 'This field is required';
        }

        setErrors(errors);
        if (Object.entries(errors).length > 0) {
            return;
        }

        onSubmit({
            type,
            url:
                type === SubmissionType.LichessChapter ||
                type === SubmissionType.LichessStudy
                    ? lichessUrl
                    : undefined,
            pgnText: type === SubmissionType.Manual ? pgnText : undefined,
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
                        onChange={(e, v) => setType(v as SubmissionType)}
                    >
                        <FormControlLabel
                            value={SubmissionType.LichessChapter}
                            control={<Radio />}
                            label='Import from Lichess Study (Single Chapter Only)'
                        />
                        {isCreating && (
                            <FormControlLabel
                                value={SubmissionType.LichessStudy}
                                control={<Radio />}
                                label='Bulk Import from Lichess Study (All Chapters)'
                            />
                        )}
                        <FormControlLabel
                            value={SubmissionType.Manual}
                            control={<Radio />}
                            label='Manual Entry'
                        />
                    </RadioGroup>
                </FormControl>

                {type === SubmissionType.LichessChapter && (
                    <TextField
                        label='Lichess Chapter URL'
                        placeholder='https://lichess.org/study/abcd1234/abcd1234'
                        value={lichessUrl}
                        onChange={(e) => setLichessUrl(e.target.value)}
                        error={!!errors.lichessUrl}
                        helperText={
                            errors.lichessUrl ||
                            'Your Lichess study must be unlisted or public'
                        }
                    />
                )}

                {type === SubmissionType.LichessStudy && (
                    <TextField
                        label='Lichess Study URL'
                        placeholder='https://lichess.org/study/abcd1234'
                        value={lichessUrl}
                        onChange={(e) => setLichessUrl(e.target.value)}
                        error={!!errors.lichessUrl}
                        helperText={
                            errors.lichessUrl ||
                            'Your Lichess study must be unlisted or public'
                        }
                    />
                )}

                {type === SubmissionType.Manual && (
                    <TextField
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

                <LoadingButton
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
