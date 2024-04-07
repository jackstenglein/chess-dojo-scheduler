import { Button, Container, Stack, Typography } from '@mui/material';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PgnBoard, { PgnBoardApi } from '../board/pgn/PgnBoard';
import { sampleProblem } from './tactics';
import { CompletedTacticsTest } from './TacticsExamPage';

const TacticsInstructionsPage = () => {
    const pgnApi = useRef<PgnBoardApi>(null);
    const [completedPgn, setCompletedPgn] = useState('');
    const navigate = useNavigate();

    const onFinishSample = () => {
        setCompletedPgn(pgnApi.current?.getPgn() || '');
    };

    const onResetSample = () => {
        setCompletedPgn('');
    };

    const onStart = () => {
        navigate('/tactics/test');
    };

    return (
        <Container sx={{ py: 4 }}>
            <Stack alignItems='start'>
                <Typography variant='h4'>Dojo Tactics Test</Typography>

                <Typography variant='h6' mt={4}>
                    Instructions
                </Typography>
                <Typography>
                    <ul style={{ margin: 0 }}>
                        <li>
                            Unlike most online tactics trainers, you play both sides. You
                            will not receive feedback on any of your moves until the test
                            is fully complete.
                        </li>
                        <li>
                            For each problem, the board will be oriented with the side to
                            move on the bottom.
                        </li>
                        <li>
                            Points are awarded based on how many critical moves you find.
                            A single problem may have multiple points in different
                            variations, so make sure to look for different defenses and
                            respond against each of them. It's up to you to figure out
                            which variations are critical and how deep to continue each
                            variation.
                        </li>
                        <li>
                            The PGN editor is available for you to add comments or
                            annotations if this helps you think, but you are not graded on
                            these. You are graded solely on which moves are present in
                            your final PGN.
                        </li>
                        <li>
                            You will have one hour for 10 positions. You can split the
                            time up among the positions however you choose. You can also
                            return to positions you previously worked on to update your
                            answers.
                        </li>
                        <li>
                            The test ends when your time runs out or when you click the
                            "Finish Early" button.
                        </li>
                        <li>
                            Once the test starts, do not refresh or navigate away from the
                            page. Your progress will be lost if you do so.
                        </li>
                    </ul>
                </Typography>

                <Typography variant='h6' mt={4}>
                    Example
                </Typography>
                <Typography sx={{ mb: 3 }}>
                    The following is an example position similar to the ones you will see
                    in the test. You can use this as an optional, untimed warm-up to see
                    how the test will work. You are not graded on this problem. When you
                    have finished making your moves, click the "Check Sample" button to
                    see the score you would have gotten in the real test.
                </Typography>

                <Button
                    variant='contained'
                    onClick={completedPgn ? onResetSample : onFinishSample}
                    sx={{ mb: 3 }}
                >
                    {completedPgn ? 'Reset' : 'Check Sample'}
                </Button>

                {completedPgn ? (
                    <CompletedTacticsTest
                        userPgn={completedPgn}
                        solutionPgn={sampleProblem.solution}
                        orientation={sampleProblem.orientation}
                        underboardTabs={[]}
                    />
                ) : (
                    <PgnBoard
                        ref={pgnApi}
                        fen={sampleProblem.fen}
                        showPlayerHeaders={false}
                        startOrientation={sampleProblem.orientation}
                        underboardTabs={[]}
                    />
                )}

                <Typography variant='h6' mt={6}>
                    Start Test
                </Typography>
                <Typography>
                    Click the button below to start. Your time begins as soon as you click
                    the button.
                </Typography>

                <Button variant='contained' sx={{ mt: 3 }} onClick={onStart}>
                    Begin Test
                </Button>
            </Stack>
        </Container>
    );
};

export default TacticsInstructionsPage;
