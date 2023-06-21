import { useLayoutEffect, useState } from 'react';
import { Button, Grid, Stack, Typography } from '@mui/material';
import { pgnView } from '@mliebelt/pgn-viewer';

import { useAuth } from '../../auth/Auth';
import { ModuleProps } from './Module';

interface ExerciseProps {
    index: number;
    pgn: string;
    dark?: boolean;
}

const Exercise: React.FC<ExerciseProps> = ({ index, pgn, dark }) => {
    const boardId = `board`;
    const [showAnswer, setShowAnswer] = useState(false);

    useLayoutEffect(() => {
        if (pgn) {
            pgnView(boardId, {
                pgn,
                pieceStyle: 'alpha',
                theme: 'blue',
                showResult: false,
                notationLayout: 'list',
                resizable: false,
                orientation: 'black',
            });
        }
    });

    let className = 'reactBoard opening exercise';
    if (dark) {
        className += ' dark';
    }
    if (!showAnswer) {
        className += ' hideMoves';
    }

    return (
        <Stack alignItems='start'>
            <Typography variant='subtitle2' fontWeight='bold' color='text.secondary'>
                Exercise #{index + 1}: Black to Play
            </Typography>

            <Grid container mt={1} rowGap={2}>
                <Grid item sm={12} md={9}>
                    <div id={boardId} className={className}></div>
                </Grid>
                <Grid item xs={12} mt={1}>
                    <Button
                        variant='contained'
                        onClick={() => setShowAnswer(!showAnswer)}
                    >
                        {showAnswer ? 'Hide' : 'Show'} Answer
                    </Button>
                </Grid>
            </Grid>
        </Stack>
    );
};

const ExercisesModule: React.FC<ModuleProps> = ({ module }) => {
    const user = useAuth().user!;

    console.log('Module: ', module);

    if (!module.pgns) {
        return null;
    }

    return (
        <Stack>
            <Typography variant='h6'>{module.name}</Typography>
            <Typography>{module.description}</Typography>

            <Stack pt={3}>
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
