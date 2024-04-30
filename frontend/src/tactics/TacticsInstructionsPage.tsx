import { Quiz } from '@mui/icons-material';
import { Button, Container, Stack, Typography } from '@mui/material';
import { useRef } from 'react';
import { useCountdown } from 'react-countdown-circle-timer';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RequestStatus, useRequest } from '../api/Request';
import PgnBoard, { PgnBoardApi } from '../board/pgn/PgnBoard';
import { DefaultUnderboardTab } from '../board/pgn/boardTools/underboard/Underboard';
import { Exam, ExamAnswer, ExamType } from '../database/exam';
import {
    CompletedTacticsExam,
    TacticsTestMoveButtonExtras,
    getScores,
} from './TacticsExamPage';
import TacticsExamPgnSelector from './TacticsExamPgnSelector';
import { sampleProblem } from './tactics';

const sampleExam: Exam = {
    type: ExamType.Tactics,
    id: 'sample',
    name: 'Sample',
    cohortRange: 'Instructions',
    pgns: [sampleProblem.solution],
    timeLimitSeconds: 3600,
    answers: {},
};

const TacticsInstructionsPage = () => {
    const pgnApi = useRef<PgnBoardApi>(null);
    const navigate = useNavigate();
    const locationState = useLocation().state;
    const request = useRequest<ExamAnswer>();

    const onFinishSample = () => {
        const scores = getScores(sampleExam, [pgnApi.current?.getPgn() || '']);
        request.onSuccess({
            type: 'sample',
            id: 'sample',
            examType: ExamType.Tactics,
            attempts: [
                {
                    answers: [
                        {
                            pgn: pgnApi.current?.getPgn() || '',
                            score: scores.problems[0].user,
                            total: scores.problems[0].solution,
                        },
                    ],
                    cohort: 'sample',
                    rating: -1,
                    timeUsedSeconds: Math.round(countdown.elapsedTime),
                    createdAt: new Date().toISOString(),
                },
            ],
        });
    };

    const onStart = () => {
        navigate('/tactics/exam', { state: locationState });
    };

    const countdown = useCountdown({
        isPlaying: false,
        size: 80,
        strokeWidth: 6,
        duration: 3600,
        colors: ['#66bb6a', '#29b6f6', '#ce93d8', '#ffa726', '#f44336'],
        colorsTime: [3600, 2700, 1800, 900, 0],
        trailColor: 'rgba(0,0,0,0)',
        onComplete: onFinishSample,
    });

    if (!locationState.exam) {
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
                        The following is an example position similar to the ones you will
                        see in the test. You can use this as an optional, untimed warm-up
                        to see how the test will work. You are not graded on this problem.
                        When you have finished making your moves, click the "Finish Early"
                        button to see the score you would have gotten in the real test.
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
                <PgnBoard
                    ref={pgnApi}
                    fen={sampleProblem.fen}
                    showPlayerHeaders={false}
                    startOrientation={sampleProblem.orientation}
                    underboardTabs={[
                        {
                            name: 'testInfo',
                            tooltip: 'Test Info',
                            icon: <Quiz />,
                            element: (
                                <TacticsExamPgnSelector
                                    cohortRange='Instructions'
                                    name='Sample'
                                    count={1}
                                    selected={0}
                                    onSelect={() => null}
                                    countdown={countdown}
                                    onComplete={onFinishSample}
                                />
                            ),
                        },
                        DefaultUnderboardTab.Editor,
                    ]}
                    initialUnderboardTab='testInfo'
                    allowMoveDeletion
                    slots={{
                        moveButtonExtras: TacticsTestMoveButtonExtras,
                    }}
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
                <ul style={{ margin: 0 }}>
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
                        For each problem, the board will be oriented with the side to move
                        on the bottom.
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
                </ul>
            </Typography>
        </>
    );
};
