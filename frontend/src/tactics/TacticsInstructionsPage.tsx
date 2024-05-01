import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RequestStatus, useRequest } from '../api/Request';
import { Exam, ExamAnswer, ExamType } from '../database/exam';
import { CompletedTacticsExam, InProgressTacticsExam } from './TacticsExamPage';
import { sampleProblems } from './tactics';

const sampleExam: Exam = {
    type: ExamType.Tactics,
    id: 'sample',
    name: 'Sample',
    cohortRange: 'Instructions',
    pgns: sampleProblems,
    timeLimitSeconds: 3600,
    answers: {},
};

const TacticsInstructionsPage = () => {
    const navigate = useNavigate();
    const locationState = useLocation().state;
    const request = useRequest<ExamAnswer>();

    const onStart = () => {
        navigate('/tactics/exam', { state: locationState });
    };

    if (!locationState || !locationState.exam) {
        return <Navigate to='/tactics/' />;
    }

    return (
        <Container sx={{ py: 4 }} maxWidth={false}>
            <Container>
                <Stack alignItems='start'>
                    <Typography variant='h4'>Dojo Tactics Test</Typography>

                    <Instructions />

                    <Typography variant='h6' mt={4}>
                        Example
                    </Typography>
                    <Typography sx={{ mb: 3 }}>
                        The following is a sample test similar to the one you will take.
                        You can use this as an optional, untimed warm-up to see how the
                        test will work. You are not graded on these problems. When you
                        have finished making your moves, click the "Finish Early" button
                        to see the score you would have gotten if this had been a real
                        test.
                    </Typography>
                </Stack>
            </Container>

            {request.status === RequestStatus.Success ? (
                <CompletedTacticsExam
                    exam={sampleExam}
                    answerRequest={request}
                    onReset={request.reset}
                />
            ) : (
                <InProgressTacticsExam
                    exam={sampleExam}
                    setExam={() => null}
                    answerRequest={request}
                    setIsRetaking={() => null}
                    disableClock
                    disableSave
                />
            )}

            <Container>
                <Stack alignItems='start'>
                    <Typography variant='h6' mt={6}>
                        Start Test
                    </Typography>
                    <Typography>
                        Click the button below to start. Your time begins as soon as you
                        click the button.
                    </Typography>

                    <Button variant='contained' sx={{ mt: 3 }} onClick={onStart}>
                        Begin Test
                    </Button>
                </Stack>
            </Container>
        </Container>
    );
};

export default TacticsInstructionsPage;

export const Instructions = () => {
    return (
        <>
            <Typography variant='h6' mt={4}>
                Instructions
            </Typography>
            <Typography>
                <Box component='ul' sx={{ m: 0, '& li': { mt: 1 } }}>
                    <li>
                        Unlike most online tactics trainers, you play both your moves and
                        your opponent's. You will not receive feedback on any moves until
                        the test is fully complete.
                    </li>
                    <li>
                        Points are awarded based on how many critical moves you find. A
                        single problem may have multiple variations for your opponent, so
                        make sure to look for different defenses and respond against each
                        of them. It's up to you to decide which variations are critical
                        and how deep to continue each variation.
                    </li>
                    <li>
                        In each variation, only your main move will be counted as part of
                        your solution. You can promote variations to select which moves
                        will be included in your solution.
                    </li>
                    <li>
                        Not every problem has a tactical solution. In this case, just play
                        a move that improves your position in some way.
                    </li>
                    <li>
                        For each problem, the board will be oriented with the side to move
                        on the bottom. The side to move will also be displayed in the list
                        of problems.
                    </li>
                    <li>
                        The PGN editor is available for you to add comments or annotations
                        if this helps you think, but you are not graded on these. You are
                        graded solely on which moves are present in your final PGN.
                    </li>
                    <li>
                        You will have one hour for 10 positions. Some problems may be
                        harder than others. You can split the time up among the positions
                        however you choose. You can also return to positions you
                        previously worked on to update your answers.
                    </li>
                    <li>
                        The test ends when your time runs out or when you click the
                        "Finish Early" button.
                    </li>
                    <li>
                        Once the test starts, do not refresh or navigate away from the
                        page. Your progress will be lost if you do so.
                    </li>
                </Box>
            </Typography>
        </>
    );
};
