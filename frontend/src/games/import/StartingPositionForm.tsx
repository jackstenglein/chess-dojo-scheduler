import { Box, Stack } from '@mui/material';
import { useState } from 'react';
import { GameSubmissionType, RemoteGame } from '../../api/gameApi';
import Board from '../../board/Board';
import { ImportButton } from './ImportButton';

interface StartingPositionFormProps {
    loading: boolean;
    onSubmit: (game: RemoteGame) => void;
}

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const StartingPositionForm: React.FC<StartingPositionFormProps> = ({
    loading,
    onSubmit,
}) => {
    const [fen] = useState(startingPositionFen);

    const handleSubmit = () => {
        onSubmit({
            type: GameSubmissionType.StartingPosition,
        });
    };

    return (
        <Stack>
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
