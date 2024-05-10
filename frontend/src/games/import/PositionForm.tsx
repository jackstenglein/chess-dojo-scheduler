import { Chess } from '@jackstenglein/chess';
import { Box, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { GameSubmissionType, RemoteGame } from '../../api/gameApi';
import Board from '../../board/Board';
import { ImportButton } from './ImportButton';

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

interface FENFieldProps {
    fen: string;
    changeFen: (fen: string) => void;
    error: string | null;
}

function FENField({ fen, changeFen, error }: FENFieldProps) {
    return (
        <TextField
            sx={{ flexGrow: 1 }}
            data-cy='fen-entry'
            label='FEN'
            value={fen}
            onChange={(e) => changeFen(e.target.value)}
            error={!!error}
            helperText={error}
            placeholder={startingPositionFen}
        />
    );
}

interface PositionFormProps {
    loading: boolean;
    by: 'fen' | 'starting' | 'sparring';
    onSubmit: (game: RemoteGame) => void;
}

export const PositionForm: React.FC<PositionFormProps> = ({ loading, onSubmit, by }) => {
    const [fen, setFen] = useState('');
    const [error, setError] = useState<string | null>(null);

    const changeFen = (fen: string) => {
        setError(null);
        setFen(fen);
    };

    const handleSubmit = () => {
        const adjustedFen = fen === '' ? startingPositionFen : fen.trim();

        try {
            new Chess(adjustedFen);
        } catch {
            setError('Invalid FEN');
            return;
        }

        onSubmit({
            fen: adjustedFen,
            type: GameSubmissionType.FEN,
        });
    };

    return (
        <Box>
            <Stack spacing={1}>
                <Box display='flex' gap={1} sx={{ flexGrow: 1, maxWidth: '500px' }}>
                    {by === 'fen' && (
                        <FENField changeFen={changeFen} fen={fen} error={error} />
                    )}

                    <ImportButton
                        sx={{ alignSelf: 'flex-start' }}
                        loading={loading}
                        onClick={handleSubmit}
                    />
                </Box>
                <Box sx={{ aspectRatio: '1 / 1', maxWidth: '500px', height: 'auto' }}>
                    <Board
                        config={{
                            fen,
                            viewOnly: true,
                        }}
                    />
                </Box>
            </Stack>
        </Box>
    );
};
