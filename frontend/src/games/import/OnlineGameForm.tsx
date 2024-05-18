import { LoadingButton } from '@mui/lab';
import {
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import {
    GameSubmissionType,
    isChesscomAnalysisURL,
    isChesscomGameURL,
    isLichessChapterURL,
    isLichessGameURL,
    isLichessStudyURL,
} from '../../api/gameApi';
import { ImportDialogProps } from './ImportWizard';

export const OnlineGameForm: React.FC<ImportDialogProps> = ({
    loading,
    onSubmit,
    onClose,
}) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (url.trim() === '') {
            setError('URL is required');
            return;
        }

        const urlCheckers: [GameSubmissionType, (url: string) => boolean][] = [
            [GameSubmissionType.LichessChapter, isLichessChapterURL],
            [GameSubmissionType.LichessStudy, isLichessStudyURL],
            [GameSubmissionType.LichessGame, isLichessGameURL],
            [GameSubmissionType.ChesscomGame, isChesscomGameURL],
            [GameSubmissionType.ChesscomAnalysis, isChesscomAnalysisURL],
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

        setError('The provided URL is unsupported. Please make sure it is correct.');
    };

    return (
        <>
            <DialogTitle>Import Online Game</DialogTitle>
            <DialogContent>
                <TextField
                    data-cy='online-game-url'
                    label='Lichess or Chess.com URL'
                    placeholder='https://lichess.org/study/abcd1234/abcd1234'
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    error={!!error}
                    helperText={error}
                    fullWidth
                    sx={{ mt: 0.8 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <LoadingButton loading={loading} onClick={handleSubmit}>
                    Import
                </LoadingButton>
            </DialogActions>
        </>
    );
};
