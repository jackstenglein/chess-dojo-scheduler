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
import { Request, RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { BoardApi, Chess } from '../board/Board';
import PgnBoard, {
    BlockBoardKeyboardShortcuts,
    PgnBoardApi,
    useChess,
} from '../board/pgn/PgnBoard';
import { DefaultUnderboardTab } from '../board/pgn/boardTools/underboard/Underboard';
import { ButtonProps as MoveButtonProps } from '../board/pgn/pgnText/MoveButton';
import { Exam, ExamAnswer, ExamAttempt } from '../database/exam';
import { getCurrentRating, normalizeToFide } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import CompletedTacticsExamPgnSelector from './CompletedTacticsExamPgnSelector';
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
    const [exam, setExam] = useState<Exam>(useLocation().state?.exam);
    const answerRequest = useRequest<ExamAnswer>();
    const [isRetaking, setIsRetaking] = useState(false);
    const [showRetakeDialog, setShowRetakeDialog] = useState(false);
    const [showLatestAttempt, setShowLatestAttempt] = useState(false);

    const hasTakenExam = Boolean(exam?.answers[user.username]);

    useEffect(() => {
        if (!answerRequest.isSent() && exam && hasTakenExam) {
            answerRequest.onStart();
            api.getExamAnswer(exam.id)
                .then((resp) => {
                    console.log('getExamAnswer: ', resp);
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

    if (answerRequest.isFailure()) {
        return (
            <Container>
                <RequestSnackbar request={answerRequest} />
            </Container>
        );
    }

    const onRetake = () => {
        setShowRetakeDialog(false);
        setIsRetaking(true);
        setShowLatestAttempt(true);
    };

    if (hasTakenExam && !isRetaking) {
        if (!answerRequest.isSent() || answerRequest.isLoading()) {
            return <LoadingPage />;
        }
        return (
            <>
                <CompletedTacticsExam
                    exam={exam}
                    answerRequest={answerRequest}
                    onReset={() => setShowRetakeDialog(true)}
                    resetLabel='Retake Test'
                    showLatestAttempt={showLatestAttempt}
                />
                <Dialog
                    open={showRetakeDialog}
                    onClose={() => setShowRetakeDialog(false)}
                >
                    <DialogTitle>Retake this test?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            You can retake this test for practice, but your original score
                            will still be used for your stats on this test and your Dojo
                            Tactics rating.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowRetakeDialog(false)}>Cancel</Button>
                        <Button onClick={onRetake}>Retake</Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }

    return (
        <InProgressTacticsExam
            exam={exam}
            setExam={setExam}
            answerRequest={answerRequest}
            setIsRetaking={setIsRetaking}
        />
    );
};

export default TacticsExamPage;

interface InProgressTacticsExamProps {
    exam: Exam;
    setExam: (e: Exam) => void;
    answerRequest: Request<ExamAnswer>;
    setIsRetaking: (v: boolean) => void;
    disableClock?: boolean;
    disableSave?: boolean;
}

export const InProgressTacticsExam: React.FC<InProgressTacticsExamProps> = ({
    exam,
    setExam,
    answerRequest,
    setIsRetaking,
    disableClock,
    disableSave,
}) => {
    const user = useAuth().user!;
    const api = useApi();
    const pgnApi = useRef<PgnBoardApi>(null);
    const [selectedProblem, setSelectedProblem] = useState(0);
    const answerPgns = useRef<string[]>((exam?.pgns || []).map(() => ''));
    const [isTimeOver, setIsTimeOver] = useState(false);

    const onCountdownComplete = useCallback(() => {
        setIsTimeOver(true);
    }, [setIsTimeOver]);

    const countdown = useCountdown({
        isPlaying: !disableClock,
        size: 80,
        strokeWidth: 6,
        duration: exam?.timeLimitSeconds || 3600,
        colors: ['#66bb6a', '#29b6f6', '#ce93d8', '#ffa726', '#f44336'],
        colorsTime: getColorsTime(exam?.timeLimitSeconds),
        trailColor: 'rgba(0,0,0,0)',
        onComplete: onCountdownComplete,
    });

    const onChangeProblem = (index: number) => {
        answerPgns.current[selectedProblem] = pgnApi.current?.getPgn() || '';
        setSelectedProblem(index);
    };

    const onComplete = () => {
        answerPgns.current[selectedProblem] = pgnApi.current?.getPgn() || '';
        const scores = getScores(exam, answerPgns.current);

        const attempt: ExamAttempt = {
            answers: answerPgns.current.map((pgn, i) => ({
                pgn,
                score: scores.problems[i].user,
                total: scores.problems[i].solution,
            })),
            cohort: user.dojoCohort,
            rating: normalizeToFide(getCurrentRating(user), user.ratingSystem),
            timeUsedSeconds: Math.round(countdown.elapsedTime),
            createdAt: new Date().toISOString(),
        };

        const answer: ExamAnswer = {
            type: user.username,
            id: exam.id,
            examType: exam.type,
            attempts: [...(answerRequest.data?.attempts || []), attempt],
        };

        answerRequest.onSuccess(answer);
        setExam({
            ...exam,
            answers: {
                [user.username]: {
                    cohort: user.dojoCohort,
                    rating: attempt.rating,
                    score: scores.total.user,
                    createdAt: attempt.createdAt,
                },
                ...exam.answers,
            },
        });
        setIsRetaking(false);

        if (!disableSave) {
            api.putExamAttempt(exam.type, exam.id, attempt)
                .then((resp) => {
                    console.log('putExamAttempt: ', resp);
                    if (resp.data) {
                        setExam(resp.data);
                    }
                })
                .catch((err) => {
                    console.error('putExamAttempt: ', err);
                });
        }
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
                        name: 'examInfo',
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
                                orientations={exam.pgns.map((pgn) => getOrientation(pgn))}
                            />
                        ),
                    },
                    DefaultUnderboardTab.Editor,
                ]}
                initialUnderboardTab='examInfo'
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

export function getScores(exam: Exam, answerPgns: string[]): Scores {
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

interface CompletedTacticsExamProps {
    exam: Exam;
    answerRequest: Request<ExamAnswer>;
    onReset: () => void;
    resetLabel?: string;
    showLatestAttempt?: boolean;
}

export const CompletedTacticsExam: React.FC<CompletedTacticsExamProps> = ({
    exam,
    answerRequest,
    onReset,
    resetLabel,
    showLatestAttempt,
}) => {
    const [selectedAttempt, setAttempt] = useState(
        showLatestAttempt ? (answerRequest.data?.attempts.length || 1) - 1 : 0,
    );
    const [selectedProblem, setSelectedProblem] = useState(0);

    const attempt = answerRequest.data?.attempts[selectedAttempt];
    const solutionPgn = exam.pgns[selectedProblem];
    const userPgn = attempt?.answers[selectedProblem].pgn || '';

    const orientation = getOrientation(solutionPgn);

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
        },
        [userPgn, orientation],
    );

    if (!attempt) {
        return null;
    }

    const scores: Scores = {
        problems: attempt.answers.map((a) => ({ user: a.score, solution: a.total })),
        total: {
            user: attempt.answers.reduce((sum, a) => sum + a.score, 0) || 0,
            solution: attempt.answers.reduce((sum, a) => sum + a.total, 0) || 0,
        },
    };

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <PgnBoard
                key={`${selectedProblem}-${selectedAttempt}`}
                onInitialize={onInitialize}
                pgn={solutionPgn}
                showPlayerHeaders={false}
                startOrientation={orientation}
                underboardTabs={[
                    {
                        name: 'examInfo',
                        tooltip: 'Test Info',
                        icon: <Quiz />,
                        element: (
                            <CompletedTacticsExamPgnSelector
                                name={exam.name}
                                cohortRange={exam.cohortRange}
                                count={exam.pgns.length}
                                selected={selectedProblem}
                                onSelect={setSelectedProblem}
                                scores={scores}
                                elapsedTime={
                                    answerRequest.data?.attempts[selectedAttempt]
                                        ?.timeUsedSeconds || 0
                                }
                                onReset={onReset}
                                resetLabel={resetLabel}
                                attempt={selectedAttempt}
                                selectAttempt={setAttempt}
                                maxAttempts={answerRequest.data?.attempts.length || 1}
                            />
                        ),
                    },
                    {
                        name: 'examStats',
                        tooltip: 'Test Statistics',
                        icon: <Assessment />,
                        element: <ExamStatistics exam={exam} />,
                    },
                ]}
                initialUnderboardTab='examInfo'
                slots={{
                    moveButtonExtras: CompletedMoveButtonExtras,
                }}
            />
        </Container>
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
