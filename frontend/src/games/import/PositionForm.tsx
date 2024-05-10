import { Box, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { GameSubmissionType, RemoteGame } from '../../api/gameApi';
import Board from '../../board/Board';
import { ImportButton } from './ImportButton';

interface PositionFormProps {
    loading: boolean;
    onSubmit: (game: RemoteGame) => void;
}

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const PositionForm: React.FC<PositionFormProps> = ({ loading, onSubmit }) => {
    const [fen, setFen] = useState(startingPositionFen);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (fen === '') {
            setError('FEN is required.');
            return;
        }

        onSubmit({
            fen,
            type: GameSubmissionType.FEN,
        });
    };

    return (
        <Stack>
            <TextField
                sx={{ flexGrow: 1 }}
                data-cy='fen-entry'
                label='FEN'
                value={fen}
                onChange={(e) => setFen(e.target.value.trim())}
                error={!!error}
                helperText={error}
            />
            <Box
                sx={{
                    aspectRatio: 1,
                    width: 'var(--board-size)',
                }}
            >
                <Board config={{ fen: fen }} />
            </Box>
            <ImportButton loading={loading} onClick={handleSubmit} />
        </Stack>
    );
};
