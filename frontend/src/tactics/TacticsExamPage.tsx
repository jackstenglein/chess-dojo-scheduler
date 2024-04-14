import { Info, Quiz, RemoveCircle, Warning } from '@mui/icons-material';
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
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useCountdown } from 'react-countdown-circle-timer';
import { BoardApi, Chess } from '../board/Board';
import {
    DefaultUnderboardTab,
    UnderboardTab,
} from '../board/pgn/boardTools/underboard/Underboard';
import PgnBoard, {
    BlockBoardKeyboardShortcuts,
    PgnBoardApi,
    useChess,
} from '../board/pgn/PgnBoard';
import { ButtonProps as MoveButtonProps } from '../board/pgn/pgnText/MoveButton';
import {
    addExtraVariation,
    firstTest,
    getMoveDescription,
    getSolutionScore,
    scoreVariation,
} from './tactics';
import TacticsExamPgnSelector from './TacticsExamPgnSelector';
import { Instructions } from './TacticsInstructionsPage';

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

const TacticsExamPage = () => {
    const pgnApi = useRef<PgnBoardApi>(null);
    const [selectedProblem, setSelectedProblem] = useState(0);
    const answerPgns = useRef<string[]>(firstTest.map(() => ''));
    const [isTimeOver, setIsTimeOver] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const onCountdownComplete = useCallback(() => {
        setIsTimeOver(true);
    }, [setIsTimeOver]);

    const countdown = useCountdown({
        isPlaying: true,
        size: 80,
        strokeWidth: 6,
        duration: 3600,
        colors: ['#66bb6a', '#29b6f6', '#ce93d8', '#ffa726', '#f44336'],
        colorsTime: [3600, 2700, 1800, 900, 0],
        trailColor: 'rgba(0,0,0,0)',
        onComplete: onCountdownComplete,
    });

    const scores: Scores | undefined = useMemo(() => {
        if (!isComplete) {
            return undefined;
        }

        const scores: Scores = {
            total: { user: 0, solution: 0 },
            problems: [],
        };

        for (let i = 0; i < firstTest.length; i++) {
            const solutionChess = new Chess({ pgn: firstTest[i].solution });
            const userChess = new Chess({ pgn: answerPgns.current[i] });
            const solutionScore = getSolutionScore(solutionChess.history());
            const userScore = scoreVariation(
                firstTest[i].orientation,
                solutionChess.history(),
                null,
                userChess,
            );

            scores.total.solution += solutionScore;
            scores.total.user += userScore;
            scores.problems.push({
                user: userScore,
                solution: solutionScore,
            });
        }

        return scores;
    }, [isComplete, answerPgns]);

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
                    key={firstTest[selectedProblem].fen}
                    userPgn={answerPgns.current[selectedProblem]}
                    solutionPgn={firstTest[selectedProblem].solution}
                    orientation={firstTest[selectedProblem].orientation}
                    underboardTabs={[
                        {
                            name: 'testInfo',
                            tooltip: 'Test Info',
                            icon: <Quiz />,
                            element: (
                                <TacticsExamPgnSelector
                                    count={firstTest.length}
                                    selected={selectedProblem}
                                    onSelect={onChangeProblem}
                                    scores={scores}
                                />
                            ),
                        },
                    ]}
                    initialUnderboardTab='testInfo'
                />
            </Container>
        );
    }

    const onComplete = () => {
        answerPgns.current[selectedProblem] = pgnApi.current?.getPgn() || '';
        setIsComplete(true);
        setSelectedProblem(0);
    };

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <PgnBoard
                ref={pgnApi}
                key={firstTest[selectedProblem].fen}
                fen={firstTest[selectedProblem].fen}
                pgn={answerPgns.current[selectedProblem]}
                startOrientation={firstTest[selectedProblem].orientation}
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
                                count={firstTest.length}
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

export const TacticsTestMoveButtonExtras: React.FC<MoveButtonProps> = ({ move }) => {
    const { chess } = useChess();

    if (!chess) {
        console.log('No chess');
        return null;
    }

    console.log('Turn: ', chess.turn(null));
    if (move.color !== chess.turn(null)) {
        return null;
    }

    if (chess.isMainline(move.san, move.previous)) {
        console.log('Mainline');
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
            getSolutionScore(chess.history());
            const answerChess = new Chess({ pgn: userPgn });
            answerChess.seek(null);
            scoreVariation(orientation || 'white', chess.history(), null, answerChess);
            addExtraVariation(answerChess.history(), null, chess);
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
    const { score, found, extra } = move.userData || {};

    if (extra) {
        return (
            <Tooltip title='This move was not present in the solution. You neither gained nor lost points for it.'>
                <RemoveCircle fontSize='inherit' sx={{ ml: 0.5 }} color='disabled' />
            </Tooltip>
        );
    }

    if (score > 0) {
        return (
            <Tooltip title={getMoveDescription(found, score)}>
                <Box
                    sx={{
                        backgroundColor: found ? 'success.main' : 'error.main',
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
                            color: found ? 'success.contrastText' : 'background.paper',
                        }}
                    >
                        {found ? '+' : '-'}
                        {score}
                    </Typography>
                </Box>
            </Tooltip>
        );
    }

    return null;
};
