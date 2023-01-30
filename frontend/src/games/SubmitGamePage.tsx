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
import { useNavigate } from 'react-router-dom';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';

const lichessStudyRegex = new RegExp('^https://lichess.org/study/.{8}/.{8}$');

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
    Lichess = 'lichess',
    Manual = 'manual',
}

const SubmitGamePage = () => {
    const api = useApi();
    const request = useRequest();
    const navigate = useNavigate();

    const [type, setType] = useState<SubmissionType>(SubmissionType.Lichess);
    const [lichessUrl, setLichessUrl] = useState('');
    const [pgnText, setPgnText] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const onSubmit = () => {
        const errors: Record<string, string> = {};
        if (type === SubmissionType.Lichess && !lichessStudyRegex.test(lichessUrl)) {
            errors.lichessUrl = 'Does not match the Lichess study URL format';
        } else if (type === SubmissionType.Manual && pgnText === '') {
            errors.pgnText = 'This field is required';
        }

        setErrors(errors);
        if (Object.entries(errors).length > 0) {
            return;
        }

        request.onStart();
        api.createGame({
            type,
            url: type === SubmissionType.Lichess ? lichessUrl : undefined,
            pgnText: type === SubmissionType.Manual ? pgnText : undefined,
        })
            .then((response) => {
                console.log('CreateGame: ', response);
                navigate(
                    `../${response.data.cohort.replaceAll(
                        '+',
                        '%2B'
                    )}/${response.data.id.replaceAll('?', '%3F')}`
                );
                request.onSuccess();
            })
            .catch((err) => {
                console.error('CreateGame ', err);
                request.onFailure(err);
            });
    };

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={2}>
                <Typography variant='h6'>Submit Game</Typography>

                <FormControl>
                    <RadioGroup
                        value={type}
                        onChange={(e, v) => setType(v as SubmissionType)}
                    >
                        <FormControlLabel
                            value={SubmissionType.Lichess}
                            control={<Radio />}
                            label='Import from Lichess Study'
                        />
                        <FormControlLabel
                            value={SubmissionType.Manual}
                            control={<Radio />}
                            label='Manual Entry'
                        />
                    </RadioGroup>
                </FormControl>

                {type === SubmissionType.Lichess && (
                    <TextField
                        label='Lichess Study URL'
                        placeholder='https://lichess.org/study/abcd1234/abcd1234'
                        value={lichessUrl}
                        onChange={(e) => setLichessUrl(e.target.value)}
                        error={!!errors.lichessUrl}
                        helperText={errors.lichessUrl}
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
                    loading={request.isLoading()}
                    onClick={onSubmit}
                >
                    Submit
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default SubmitGamePage;
