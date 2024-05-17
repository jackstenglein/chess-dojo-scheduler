import { Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { CreateGameRequest, GameSubmissionType } from '../../api/gameApi';
import { ImportButton } from './ImportButton';

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

interface PGNFormProps {
    loading: boolean;
    onSubmit: (game: CreateGameRequest) => void;
}

export const PGNForm: React.FC<PGNFormProps> = ({ onSubmit, loading }) => {
    const [pgnText, setPgnText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (pgnText.trim() === '') {
            setError('This field is required');
            return;
        }

        setError('');
        onSubmit({
            pgnText,
            type: GameSubmissionType.Manual,
        });
    };

    return (
        <Stack spacing={2} alignItems='start'>
            <TextField
                data-cy='pgn-text'
                label='Paste PGN'
                placeholder={pgnTextPlaceholder}
                value={pgnText}
                onChange={(e) => setPgnText(e.target.value)}
                multiline
                minRows={5}
                error={!!error}
                helperText={error}
                fullWidth
            />
            <ImportButton loading={loading} onClick={handleSubmit} />
        </Stack>
    );
};
