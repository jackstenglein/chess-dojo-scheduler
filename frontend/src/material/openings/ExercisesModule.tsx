import { Box, Container, Stack, Typography } from '@mui/material';

import { ModuleProps } from './Module';
import PuzzleBoard from '../../board/puzzle/PuzzleBoard';
import PgnErrorBoundary from '../../games/view/PgnErrorBoundary';
import { Coach, OpeningModule, coachUrls } from '../../database/opening';
import { useCallback, useState } from 'react';
import PgnSelector from './PgnSelector';
import { useAuth } from '../../auth/Auth';
import { User } from '../../database/user';
import { useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';

function getCompleted(user: User, module: OpeningModule): boolean[] {
    let exercises: boolean[] = [];
    if (
        user.openingProgress &&
        user.openingProgress[module.id] &&
        user.openingProgress[module.id].exercises
    ) {
        exercises = user.openingProgress[module.id].exercises!;
    }

    return module.pgns.map((_: string, idx: number) => {
        if (exercises[idx]) {
            return true;
        }
        return false;
    });
}

const ExercisesModule: React.FC<ModuleProps> = ({ module }) => {
    const user = useAuth().user!;
    const [completed, setCompleted] = useState(getCompleted(user, module));
    const [selectedIndex, setSelectedIndex] = useState(0);
    const request = useRequest();
    const api = useApi();

    const onComplete = useCallback(() => {
        const newCompleted = [
            ...completed.slice(0, selectedIndex),
            true,
            ...completed.slice(selectedIndex + 1),
        ];
        setCompleted(newCompleted);

        if (module.id) {
            request.onStart();
            api.updateUser({
                openingProgress: {
                    ...user.openingProgress,
                    [module.id]: {
                        exercises: newCompleted,
                    },
                },
            })
                .then((resp) => {
                    console.log('updateUserExercises: ', resp);
                    request.onSuccess();
                })
                .catch((err) => {
                    console.error('updateUserExercises: ', err);
                    request.onFailure(err);
                });
        }
    }, [api, completed, module.id, request, selectedIndex, user.openingProgress]);

    if (!module.pgns || module.pgns.length < 1) {
        return null;
    }

    const onNextPuzzle = () => {
        onComplete();
        setSelectedIndex(selectedIndex + 1);
    };

    return (
        <Container
            maxWidth={false}
            sx={{
                pt: 4,
                pb: 4,
                px: '0 !important',
                '--gap': '16px',
                '--site-header-height': '80px',
                '--site-header-margin': '150px',
                '--player-header-height': '0px',
                '--toc-width': '21vw',
                '--coach-width': '400px',
                '--tools-height': '0px',
                '--board-width':
                    'calc(100vw - var(--coach-width) - 60px - var(--toc-width))',
                '--board-height':
                    'calc(100vh - var(--site-header-height) - var(--site-header-margin) - var(--tools-height) - 2 * var(--player-header-height))',
                '--board-size': 'calc(min(var(--board-width), var(--board-height)))',
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    rowGap: '0px',
                    gridTemplateRows: {
                        xs: 'auto auto',
                    },
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'var(--board-size) var(--gap) var(--coach-width) auto',
                    },
                    gridTemplateAreas: {
                        xs: '"extras" "subtitle" "pgn"',
                        md: '"extras . . ." "subtitle . . ." "pgn pgn pgn pgn"',
                    },
                }}
            >
                <PgnSelector
                    pgns={module.pgns}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                    completed={completed}
                />

                <Stack mt={3} gridArea='subtitle'>
                    <Typography
                        variant='subtitle2'
                        fontWeight='bold'
                        color='text.secondary'
                    >
                        Exercise #{selectedIndex + 1}
                    </Typography>
                </Stack>

                <PgnErrorBoundary pgn={module.pgns[selectedIndex]}>
                    <PuzzleBoard
                        key={module.pgns[selectedIndex]}
                        pgn={module.pgns[selectedIndex]}
                        coachUrl={coachUrls[module.coach as Coach]}
                        onComplete={onComplete}
                        onNextPuzzle={
                            selectedIndex < module.pgns.length - 1
                                ? onNextPuzzle
                                : undefined
                        }
                    />
                </PgnErrorBoundary>
            </Box>
        </Container>
    );
};

export default ExercisesModule;
