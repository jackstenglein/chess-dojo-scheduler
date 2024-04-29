import {
    Assessment,
    Info,
    Quiz,
    RemoveCircle,
    SwapHorizontalCircle,
    Warning,
} from '@mui/icons-material';
import {
    Box,
    Button,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useCountdown } from 'react-countdown-circle-timer';
import { Navigate, useLocation } from 'react-router-dom';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { BoardApi, Chess } from '../board/Board';
import PgnBoard, {
    BlockBoardKeyboardShortcuts,
    PgnBoardApi,
    useChess,
} from '../board/pgn/PgnBoard';
import {
    DefaultUnderboardTab,
    UnderboardTab,
} from '../board/pgn/boardTools/underboard/Underboard';
import { ButtonProps as MoveButtonProps } from '../board/pgn/pgnText/MoveButton';
import { Exam, ExamAnswer } from '../database/exam';
import { getCurrentRating, normalizeToFide } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import ExamStatistics from './ExamStatistics';
import TacticsExamPgnSelector from './TacticsExamPgnSelector';
import { Instructions } from './TacticsInstructionsPage';
import {
    addExtraVariation,
    getFen,
    getMoveDescription,
    getOrientation,
    getSolutionScore,
    scoreVariation,
} from './tactics';

export interface Scores {
    total: {
        user: number;
        solution: number;
    };
    problems: {
        user: number;
        solution: number;
    }[];
}

function getColorsTime(limitSeconds?: number): { 0: number } & { 1: number } & number[] {
    if (!limitSeconds) {
        return [3600, 2700, 1800, 900, 0];
    }

    return [
        limitSeconds,
        limitSeconds * 0.75,
        limitSeconds * 0.5,
        limitSeconds * 0.25,
        0,
    ];
}

const TacticsExamPage = () => {
    const user = useAuth().user!;
    const api = useApi();
    const answerRequest = useRequest<ExamAnswer>();
    const pgnApi = useRef<PgnBoardApi>(null);
    const [selectedProblem, setSelectedProblem] = useState(0);
    const exam = useLocation().state?.exam as Exam | undefined;
    const answerPgns = useRef<string[]>((exam?.pgns || []).map(() => ''));
    const [isTimeOver, setIsTimeOver] = useState(false);

    const hasTakenExam = Boolean(exam?.answers[user.username]);
    const [isComplete, setIsComplete] = useState(hasTakenExam);
    const [scores, setScores] = useState<Scores>();

    const onCountdownComplete = useCallback(() => {
        setIsTimeOver(true);
    }, [setIsTimeOver]);

    const countdown = useCountdown({
        isPlaying: !isComplete,
        size: 80,
        strokeWidth: 6,
        duration: exam?.timeLimitSeconds || 3600,
        colors: ['#66bb6a', '#29b6f6', '#ce93d8', '#ffa726', '#f44336'],
        colorsTime: getColorsTime(exam?.timeLimitSeconds),
        trailColor: 'rgba(0,0,0,0)',
        onComplete: onCountdownComplete,
    });

    useEffect(() => {
        if (!answerRequest.isSent() && exam && hasTakenExam) {
            answerRequest.onStart();
            api.getExamAnswer(exam.id)
                .then((resp) => {
                    console.log('getExamAnswer: ', resp);
                    answerPgns.current = resp.data.answers.map((a) => a.pgn);
                    setScores(getScores(exam, answerPgns.current));
                    answerRequest.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error('getExamAnswer: ', err);
                    answerRequest.onFailure(err);
                });
        }
    }, [answerRequest, api, exam, hasTakenExam]);

    if (!exam) {
        return <Navigate to='/tactics' />;
    }

    if (hasTakenExam && (!answerRequest.isSent() || answerRequest.isLoading())) {
        return <LoadingPage />;
    }

    if (answerRequest.isFailure()) {
        return (
            <Container>
                <RequestSnackbar request={answerRequest} />
            </Container>
        );
    }

    const onChangeProblem = (index: number) => {
        if (!isComplete) {
            answerPgns.current[selectedProblem] = pgnApi.current?.getPgn() || '';
        }
        setSelectedProblem(index);
    };

    if (isComplete) {
        return (
            <Container maxWidth={false} sx={{ py: 4 }}>
                <CompletedTacticsTest
                    key={exam.pgns[selectedProblem]}
                    userPgn={answerPgns.current[selectedProblem]}
                    solutionPgn={exam.pgns[selectedProblem]}
                    orientation={getOrientation(exam.pgns[selectedProblem])}
                    underboardTabs={[
                        {
                            name: 'examInfo',
                            tooltip: 'Exam Info',
                            icon: <Quiz />,
                            element: (
                                <TacticsExamPgnSelector
                                    name={exam.name}
                                    cohortRange={exam.cohortRange}
                                    count={exam.pgns.length}
                                    selected={selectedProblem}
                                    onSelect={onChangeProblem}
                                    scores={scores}
                                    elapsedTime={
                                        answerRequest.data?.timeUsedSeconds ||
                                        countdown.elapsedTime
                                    }
                                />
                            ),
                        },
                        {
                            name: 'examStats',
                            tooltip: 'Exam Statistics',
                            icon: <Assessment />,
                            element: <ExamStatistics exam={exam} />,
                        },
                    ]}
                    initialUnderboardTab='examInfo'
                />
            </Container>
        );
    }

    const onComplete = () => {
        answerPgns.current[selectedProblem] = pgnApi.current?.getPgn() || '';
        const scores = getScores(exam, answerPgns.current);
        setScores(scores);
        setIsComplete(true);
        setSelectedProblem(0);

        const answer: ExamAnswer = {
            type: user.username,
            id: exam.id,
            examType: exam.type,
            cohort: user.dojoCohort,
            rating: normalizeToFide(getCurrentRating(user), user.ratingSystem),
            timeUsedSeconds: Math.round(countdown.elapsedTime),
            createdAt: '',
            answers: answerPgns.current.map((pgn, i) => ({
                pgn,
                score: scores.problems[i].user,
                total: scores.problems[i].solution,
            })),
        };
        api.putExamAnswer(answer)
            .then((resp) => {
                console.log('putExamAnswer: ', resp);
            })
            .catch((err) => {
                console.error('putExamAnswer: ', err);
            });
    };

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <PgnBoard
                ref={pgnApi}
                key={exam.pgns[selectedProblem]}
                fen={getFen(exam.pgns[selectedProblem])}
                pgn={answerPgns.current[selectedProblem]}
                startOrientation={getOrientation(exam.pgns[selectedProblem])}
                showPlayerHeaders={false}
                underboardTabs={[
                    {
                        name: 'instructions',
                        tooltip: 'Instructions',
                        icon: <Info />,
                        element: (
                            <CardContent>
                                <Instructions />
                            </CardContent>
                        ),
                    },
                    {
                        name: 'testInfo',
                        tooltip: 'Test Info',
                        icon: <Quiz />,
                        element: (
                            <TacticsExamPgnSelector
                                name={exam.name}
                                cohortRange={exam.cohortRange}
                                count={exam.pgns.length}
                                selected={selectedProblem}
                                onSelect={onChangeProblem}
                                countdown={countdown}
                                onComplete={onComplete}
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

            <Dialog
                open={isTimeOver}
                classes={{
                    container: BlockBoardKeyboardShortcuts,
                }}
                fullWidth
            >
                <DialogTitle>Test Complete</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Your time has run out, and the test is over. Let's see how you
                        did!
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onComplete}>Continue</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TacticsExamPage;

function getScores(exam: Exam, answerPgns: string[]): Scores {
    const scores: Scores = {
        total: { user: 0, solution: 0 },
        problems: [],
    };

    for (let i = 0; i < exam.pgns.length; i++) {
        const solutionChess = new Chess({ pgn: exam.pgns[i] });
        const userChess = new Chess({ pgn: answerPgns[i] });
        const solutionScore = getSolutionScore(
            getOrientation(exam.pgns[i]),
            solutionChess.history(),
            solutionChess,
            false,
        );
        const [userScore] = scoreVariation(
            getOrientation(exam.pgns[i]),
            solutionChess.history(),
            null,
            userChess,
            false,
        );

        scores.total.solution += solutionScore;
        scores.total.user += userScore;
        scores.problems.push({
            user: userScore,
            solution: solutionScore,
        });
    }

    return scores;
}

export const TacticsTestMoveButtonExtras: React.FC<MoveButtonProps> = ({ move }) => {
    const { chess } = useChess();

    if (!chess) {
        return null;
    }

    if (move.color !== chess.turn(null)) {
        return null;
    }

    if (chess.isMainline(move.san, move.previous)) {
        return null;
    }

    return (
        <Tooltip title='This move will not be counted as part of your solution. If you want this move to be counted, promote it by using the editor or right-clicking.'>
            <Warning fontSize='small' sx={{ ml: 0.5 }} color='error' />
        </Tooltip>
    );
};

interface CompletedTacticsTestProps {
    userPgn: string;
    solutionPgn: string;
    underboardTabs: UnderboardTab[];
    initialUnderboardTab?: string;
    orientation?: 'white' | 'black';
}

export const CompletedTacticsTest: React.FC<CompletedTacticsTestProps> = ({
    userPgn,
    solutionPgn,
    underboardTabs,
    initialUnderboardTab,
    orientation,
}) => {
    const onInitialize = useCallback(
        (_board: BoardApi, chess: Chess) => {
            getSolutionScore(orientation || 'white', chess.history(), chess, false);
            const answerChess = new Chess({ pgn: userPgn });
            answerChess.seek(null);
            scoreVariation(
                orientation || 'white',
                chess.history(),
                null,
                answerChess,
                false,
            );
            addExtraVariation(answerChess.history(), null, chess);
            console.log('Final History: ', chess.history());
        },
        [userPgn, orientation],
    );

    return (
        <PgnBoard
            onInitialize={onInitialize}
            pgn={solutionPgn}
            showPlayerHeaders={false}
            startOrientation={orientation}
            underboardTabs={underboardTabs}
            initialUnderboardTab={initialUnderboardTab}
            slots={{
                moveButtonExtras: CompletedMoveButtonExtras,
            }}
        />
    );
};

const CompletedMoveButtonExtras: React.FC<MoveButtonProps> = ({ move, inline }) => {
    const { score, found, extra, isAlt, altFound } = move.userData || {};

    if (extra) {
        return (
            <Tooltip title='This move was not present in the solution. You neither gained nor lost points for it.'>
                <RemoveCircle fontSize='inherit' sx={{ ml: 0.5 }} color='disabled' />
            </Tooltip>
        );
    }

    if (isAlt) {
        if (found) {
            return (
                <Tooltip title='This move is an alternate solution. You got full credit for the mainline variation for finding this.'>
                    <SwapHorizontalCircle
                        fontSize='small'
                        sx={{ ml: 0.5 }}
                        color='success'
                    />
                </Tooltip>
            );
        }
        return (
            <Tooltip title='This move is an alternate solution. You would have received full credit for the mainline variation for finding this.'>
                <SwapHorizontalCircle
                    fontSize='small'
                    sx={{ ml: 0.5 }}
                    color='disabled'
                />
            </Tooltip>
        );
    }

    if (score > 0) {
        return (
            <Tooltip title={getMoveDescription({ found, score, altFound })}>
                <Box
                    sx={{
                        backgroundColor:
                            found || altFound ? 'success.main' : 'error.main',
                        width: '20px',
                        height: '20px',
                        borderRadius: '10px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: '2px',
                        ...(inline
                            ? {
                                  ml: 0.5,
                              }
                            : undefined),
                    }}
                >
                    <Typography
                        variant={inline ? 'body2' : 'caption'}
                        fontWeight='600'
                        sx={{
                            pt: '2px',
                            color:
                                found || altFound
                                    ? 'success.contrastText'
                                    : 'background.paper',
                        }}
                    >
                        {found || altFound ? '+' : '-'}
                        {score}
                    </Typography>
                </Box>
            </Tooltip>
        );
    }

    return null;
};
