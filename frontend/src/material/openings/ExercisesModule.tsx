import { Stack, Typography } from '@mui/material';

import { ModuleProps } from './Module';
import PuzzleBoard from '../../board/puzzle/PuzzleBoard';
import PgnErrorBoundary from '../../games/view/PgnErrorBoundary';
import { Coach } from '../../database/opening';

const coachUrls = {
    [Coach.Jesse]: 'https://chess-dojo-images.s3.amazonaws.com/icons/jesse.png',
    [Coach.Kostya]: 'https://chess-dojo-images.s3.amazonaws.com/icons/kostya.png',
    [Coach.David]: 'https://chess-dojo-images.s3.amazonaws.com/icons/david.png',
};

const ExercisesModule: React.FC<ModuleProps> = ({ module }) => {
    if (!module.pgns) {
        return null;
    }

    return (
        <Stack pt={3} spacing={6}>
            {module.pgns.map((pgn, index) => (
                <Stack key={index} alignItems='start'>
                    <Typography
                        variant='subtitle2'
                        fontWeight='bold'
                        color='text.secondary'
                    >
                        Exercise #{index + 1}
                    </Typography>

                    <PgnErrorBoundary pgn={pgn}>
                        <PuzzleBoard
                            pgn={pgn}
                            coachUrl={coachUrls[module.coach as Coach]}
                        />
                    </PgnErrorBoundary>
                </Stack>
            ))}
        </Stack>
    );
};

export default ExercisesModule;
