import { Stack, Typography } from '@mui/material';

import { useAuth } from '../../auth/Auth';
import { ModuleProps } from './Module';
import PuzzleBoard from '../../board/puzzle/PuzzleBoard';
import PgnErrorBoundary from '../../games/view/PgnErrorBoundary';

interface ExerciseProps {
    index: number;
    pgn: string;
    dark?: boolean;
}

const Exercise: React.FC<ExerciseProps> = ({ index, pgn }) => {
    return (
        <Stack alignItems='start'>
            <Typography variant='subtitle2' fontWeight='bold' color='text.secondary'>
                Exercise #{index + 1}
            </Typography>

            <PgnErrorBoundary pgn={pgn}>
                <PuzzleBoard pgn={pgn} />
            </PgnErrorBoundary>
        </Stack>
    );
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
                    <Exercise
                        key={index}
                        index={index}
                        pgn={pgn}
                        dark={user.enableDarkMode}
                    />
                ))}
            </Stack>
        </Stack>
    );
};

export default ExercisesModule;
