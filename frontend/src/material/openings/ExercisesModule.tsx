import { Stack, Typography } from '@mui/material';

import { useAuth } from '../../auth/Auth';
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
    const user = useAuth().user!;

    if (!user.isAdmin && !user.isBetaTester) {
        return <Typography>Coming Soon</Typography>;
    }

    if (!module.pgns) {
        return null;
    }

    return (
        <Stack>
            <Typography variant='h6'>{module.name}</Typography>
            <Typography>{module.description}</Typography>

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
        </Stack>
    );
};

export default ExercisesModule;
