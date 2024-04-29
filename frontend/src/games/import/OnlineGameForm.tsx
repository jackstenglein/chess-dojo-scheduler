import { useState } from 'react';

import { Box, TextField } from '@mui/material';

import {
    GameSubmissionType,
    RemoteGame,
    isChesscomGameURL,
    isLichessChapterURL,
    isLichessGameURL,
    isLichessStudyURL,
} from '../../api/gameApi';
import { ImportButton } from './ImportButton';

interface OnlineGameFormProps {
    loading: boolean;
    onSubmit: (game: RemoteGame) => void;
}

export const OnlineGameForm: React.FC<OnlineGameFormProps> = ({ loading, onSubmit }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        const urlCheckers: [GameSubmissionType, (url: string) => boolean][] = [
            [GameSubmissionType.LichessChapter, isLichessChapterURL],
            [GameSubmissionType.LichessStudy, isLichessStudyURL],
            [GameSubmissionType.LichessGame, isLichessGameURL],
            [GameSubmissionType.ChesscomGame, isChesscomGameURL],
        ];

        let submissionType: GameSubmissionType | null = null;
        for (const [candidate, matcher] of urlCheckers) {
            if (matcher(url)) {
                submissionType = candidate;
                break;
            }
        }

        if (submissionType !== null) {
            onSubmit({ url, type: submissionType });
            return;
        }

        setError('The URL provided is unsupported. Is it correct?');
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
            <ImportButton loading={loading} onClick={handleSubmit} />
        </Box>
    );
};
