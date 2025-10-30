'use client';

import { ApiContextType, useApi } from '@/api/Api';
import { Request, useRequest } from '@/api/Request';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { getPieceSx } from '@/board/boardThemes';
import { formatTime } from '@/board/pgn/boardTools/underboard/clock/ClockUsage';
import {
    PieceStyle,
    PieceStyleKey,
} from '@/board/pgn/boardTools/underboard/settings/ViewerSettings';
import PgnBoard, { PgnBoardApi, useChess } from '@/board/pgn/PgnBoard';
import { InProgressAfterPgnText } from '@/board/pgn/solitaire/SolitaireAfterPgnText';
import MultipleSelectChip from '@/components/ui/MultipleSelectChip';
import LoadingPage from '@/loading/LoadingPage';
import { Chess, Color } from '@jackstenglein/chess';
import {
    NextPuzzleRequest,
    NextPuzzleResponse,
    Puzzle,
} from '@jackstenglein/chess-dojo-common/src/puzzles/api';
import { AccessTime, Info, Timeline } from '@mui/icons-material';
import {
    Box,
    Button,
    CardContent,
    Checkbox,
    Container,
    Divider,
    FormControlLabel,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCountdown, useLocalStorage } from 'usehooks-ts';

const RATED_KEY = 'puzzles.rated';
const SHOW_TIMER_KEY = 'puzzles.showTimer';
const SHOW_RATING_KEY = 'puzzles.showRating';
const DIFFICULTY_KEY = 'puzzles.difficulty';
const THEME_KEY = 'puzzles.theme';

export function CheckmatePuzzlePage() {
    const { status } = useAuth();
    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }
    return <AuthCheckmatePuzzlePage />;
}

function readLocalStorage<T>(key: string, defaultValue: T): T {
    const value = window.localStorage.getItem(key);
    if (!value) {
        return defaultValue;
    }
    return JSON.parse(value) as T;
}

async function fetchNextPuzzle({
    api,
    request,
    requestTracker,
}: {
    api: ApiContextType;
    request?: NextPuzzleRequest;
    requestTracker?: Request<NextPuzzleResponse>;
}) {
    try {
        requestTracker?.onStart();
        const themes = readLocalStorage(THEME_KEY, ['mateIn1', 'mateIn2', 'mateIn3']);
        const difficulty = readLocalStorage(DIFFICULTY_KEY, 'standard');
        const response = await api.nextPuzzle({
            ...request,
            themes,
            relativeRating: DIFFICULTY_TO_RATING_RANGE[difficulty],
        });
        console.log(`nextPuzzle: `, response);
        requestTracker?.onSuccess(response.data);
    } catch (err) {
        console.error(`nextPuzzle: `, err);
        requestTracker?.onFailure(err);
    }
}

function AuthCheckmatePuzzlePage() {
    const api = useApi();
    const requestTracker = useRequest<NextPuzzleResponse>();
    const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>();
    const [seconds, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
        isIncrement: true,
        countStart: 0,
        countStop: -1,
    });

    useEffect(() => {
        if (!requestTracker.isSent()) {
            void fetchNextPuzzle({
                api,
                requestTracker,
            });
        }
    }, [requestTracker, api]);

    useEffect(() => {
        if (!currentPuzzle && requestTracker.data) {
            setCurrentPuzzle(requestTracker.data.puzzle);
            resetCountdown();
            startCountdown();
        }
    }, [currentPuzzle, requestTracker, resetCountdown, startCountdown]);

    const pgnRef = useRef<PgnBoardApi>(null);
    const [result, setResult] = useState<'win' | 'loss'>();
    const [complete, setComplete] = useState(false);
    const [currentRating, setCurrentRating] = useState(1505);

    const [puzzlePGN, playerColor] = useMemo(() => {
        if (!currentPuzzle) {
            return ['', Color.white];
        }
        const chess = new Chess({ fen: currentPuzzle.fen });
        for (const move of currentPuzzle.moves) {
            chess.move(move);
        }
        return [chess.renderPgn(), chess.history()[1].color];
    }, [currentPuzzle]);

    const orientation = playerColor === Color.white ? 'white' : 'black';

    const ratingChange = result === 'win' ? 10 : result === 'loss' ? -10 : 0;

    const onNextPuzzle = () => {
        setCurrentRating((r) => r + ratingChange);
        setResult(undefined);
        setComplete(false);
        setCurrentPuzzle(undefined);
    };

    const onWrongMove = () => {
        setResult('loss');
    };

    const onComplete = () => {
        stopCountdown();
        setResult((r) => r ?? 'win');
        setComplete(true);

        void fetchNextPuzzle({
            api,
            requestTracker,
            request: {
                previousPuzzle: currentPuzzle
                    ? {
                          id: currentPuzzle.id,
                          result: result ?? 'win',
                          timeSpentSeconds: seconds,
                          pgn: pgnRef.current?.getPgn() ?? '',
                      }
                    : undefined,
            },
        });
    };

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <PgnBoard
                ref={pgnRef}
                key={currentPuzzle?.fen}
                showPlayerHeaders={false}
                underboardTabs={[
                    {
                        name: 'info',
                        tooltip: 'Info',
                        icon: <Info />,
                        element: (
                            <CheckmatePuzzleUnderboard
                                puzzle={currentPuzzle}
                                seconds={seconds}
                                orientation={orientation}
                                currentRating={currentRating}
                                ratingChange={ratingChange}
                                onChangeOptions={requestTracker.reset}
                            />
                        ),
                    },
                ]}
                pgn={puzzlePGN}
                initialUnderboardTab='info'
                disableEngine={!complete}
                disableNullMoves={!complete}
                startOrientation={orientation}
                onInitialize={(board) =>
                    pgnRef.current?.solitaire.start(null, {
                        playAs: orientation,
                        board,
                        onWrongMove,
                        onComplete,
                    })
                }
                slots={{
                    afterPgnText: <AfterPgnText result={result} onNextPuzzle={onNextPuzzle} />,
                }}
            />
        </Container>
    );
}

const DIFFICULTY_TO_RATING_RANGE: Record<string, [number, number]> = {
    easiest: [-600, -400],
    easier: [-400, -200],
    standard: [-200, 200],
    harder: [200, 400],
    hardest: [400, 600],
};

function CheckmatePuzzleUnderboard({
    puzzle,
    seconds,
    orientation,
    currentRating,
    ratingChange,
    onChangeOptions,
}: {
    /** The puzzle the user is playing. */
    puzzle?: Puzzle;
    /** The number of seconds the user has been working on the puzzle. */
    seconds: number;
    /** The color the user is playing. */
    orientation: 'white' | 'black';
    /** The user's rating before taking the puzzle. */
    currentRating: number;
    /** The user's rating change after taking the puzzle. */
    ratingChange: number;
    /** A callback to invoke when the user changes options that affect the next puzzle. */
    onChangeOptions: () => void;
}) {
    const { solitaire } = useChess();
    const [rated, setRated] = useLocalStorage(RATED_KEY, true);
    const [showTimer, setShowTimer] = useLocalStorage(SHOW_TIMER_KEY, true);
    const [showRating, setShowRating] = useLocalStorage(SHOW_RATING_KEY, true);
    const [difficulty, setDifficulty] = useLocalStorage(DIFFICULTY_KEY, 'standard');
    const [themes, setThemes] = useLocalStorage(THEME_KEY, ['mateIn1', 'mateIn2', 'mateIn3']);

    const [pieceStyle] = useLocalStorage<PieceStyle>(PieceStyleKey, PieceStyle.Standard);
    const pieceSx = getPieceSx(pieceStyle);

    const [displayedRating, setDisplayedRating] = useState(currentRating);
    const animationFrameRef = useRef<number>(undefined);
    const startTimeRef = useRef<number>(undefined);

    useEffect(() => {
        if (
            !rated ||
            displayedRating === currentRating + ratingChange ||
            animationFrameRef.current
        ) {
            return;
        }

        const duration = 750;
        const start = displayedRating;
        const target = currentRating + ratingChange;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }
            const progress = timestamp - startTimeRef.current;
            const percentage = Math.min(progress / duration, 1);
            const value = Math.floor(start + percentage * (target - start));

            setDisplayedRating(value);

            if (percentage < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                startTimeRef.current = undefined;
                animationFrameRef.current = undefined;
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);
    }, [displayedRating, currentRating, ratingChange, rated]);

    return (
        <CardContent sx={{ minHeight: 1 }}>
            <Stack sx={{ minHeight: 1 }}>
                <Stack direction='row' gap={1.5}>
                    <Box
                        sx={{
                            minHeight: 1,
                            aspectRatio: 1,
                            backgroundSize: 'cover',
                            backgroundImage: pieceSx[`--${orientation}-king`],
                        }}
                    />

                    <Stack>
                        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
                            {orientation[0].toUpperCase()}
                            {orientation.slice(1)} to move
                        </Typography>
                        <Typography variant='subtitle1' color='text.secondary' fontWeight='bold'>
                            Mate in{' '}
                            {puzzle?.themes
                                .find((t) => t.startsWith('mateIn'))
                                ?.replaceAll('mateIn', '')}
                        </Typography>
                    </Stack>
                </Stack>

                <Stack
                    mt={4}
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    columnGap={2}
                    rowGap={1}
                    flexWrap='wrap'
                >
                    {(showRating || !rated) && (
                        <Stack direction='row' alignItems='center' gap={1.5}>
                            <Timeline fontSize='large' />
                            <Typography variant='h4' fontWeight='bold'>
                                {rated ? displayedRating : 'Unrated'}
                            </Typography>
                            {showRating && rated && (solitaire?.complete || ratingChange !== 0) && (
                                <Typography
                                    color={
                                        ratingChange > 0
                                            ? 'success'
                                            : ratingChange < 0
                                              ? 'error'
                                              : 'textSecondary'
                                    }
                                    fontWeight='bold'
                                >
                                    {ratingChange >= 0 && '+'}
                                    {ratingChange}
                                </Typography>
                            )}
                        </Stack>
                    )}

                    {showTimer && (
                        <Stack direction='row' alignItems='center' gap={1.5} color='text.secondary'>
                            <AccessTime />
                            <Typography variant='h5'>{formatTime(seconds)}</Typography>
                        </Stack>
                    )}
                </Stack>

                {solitaire?.complete && (
                    <Stack mt={4}>
                        {showRating && (
                            <PuzzleDetailRow label='Puzzle Rating' value={puzzle?.rating || ''} />
                        )}
                        <PuzzleDetailRow label='Total Attempts' value={puzzle?.plays || ''} />
                        <PuzzleDetailRow
                            label='Successful Attempts'
                            value={`${puzzle?.successfulPlays ?? 0} (${Math.round((1000 * (puzzle?.successfulPlays ?? 0)) / (puzzle?.plays ?? 1)) / 10}%)`}
                        />
                        <PuzzleDetailRow label='Target Time' value='1:00' />
                        <PuzzleDetailRow label='Used Time' value={formatTime(seconds)} />
                    </Stack>
                )}

                <Stack sx={{ flexGrow: 1, justifyContent: 'end' }}>
                    <MultipleSelectChip
                        label='Themes'
                        selected={themes}
                        setSelected={(v) => {
                            setThemes(v);
                            onChangeOptions();
                        }}
                        options={[
                            { value: 'mateIn1', label: 'Mate in 1' },
                            { value: 'mateIn2', label: 'Mate in 2' },
                            { value: 'mateIn3', label: 'Mate in 3' },
                        ]}
                        size='small'
                        sx={{ mb: 2.5 }}
                    />

                    <TextField
                        label='Difficulty'
                        select
                        value={difficulty}
                        size='small'
                        sx={{ mb: 1 }}
                        onChange={(e) => {
                            setDifficulty(e.target.value);
                            onChangeOptions();
                        }}
                    >
                        <MenuItem value='easiest'>Easiest (-600)</MenuItem>
                        <MenuItem value='easier'>Easier (-300)</MenuItem>
                        <MenuItem value='standard'>Standard (±200)</MenuItem>
                        <MenuItem value='harder'>Harder (+300)</MenuItem>
                        <MenuItem value='hardest'>Hardest (+600)</MenuItem>
                    </TextField>

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={rated}
                                onChange={(e) => setRated(e.target.checked)}
                            />
                        }
                        label='Rated'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={showRating}
                                onChange={(e) => setShowRating(e.target.checked)}
                            />
                        }
                        label='Show Rating'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={showTimer}
                                onChange={(e) => setShowTimer(e.target.checked)}
                            />
                        }
                        label='Show Timer'
                    />
                    {/* TODO: re-enable this */}
                    {/* <FormControlLabel
                        control={<Checkbox checked={false} disabled />}
                        label={
                            <>
                                Master Mode{' '}
                                <Tooltip title="In master mode, you play both your moves and the opponent's moves. If you do not find the correct critical response(s) for the opponent, you will lose points.">
                                    <Help
                                        fontSize='small'
                                        sx={{ color: 'text.secondary', verticalAlign: 'middle' }}
                                    />
                                </Tooltip>
                            </>
                        }
                    /> */}
                </Stack>
            </Stack>
        </CardContent>
    );
}

function PuzzleDetailRow({ label, value }: { label: string; value: string | number }) {
    return (
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                pt: '2px',
            }}
        >
            <Typography>{label}</Typography>
            <Typography fontWeight='bold'>{value}</Typography>
        </Stack>
    );
}

function AfterPgnText({
    result,
    onNextPuzzle,
}: {
    result?: 'win' | 'loss';
    onNextPuzzle: () => void;
}) {
    const { solitaire } = useChess();
    if (solitaire?.complete) {
        return (
            <Stack>
                <Divider sx={{ width: 1 }} />
                <Box sx={{ my: 1, px: 1 }}>
                    <Button onClick={onNextPuzzle}>Next Puzzle</Button>
                </Box>
            </Stack>
        );
    }
    if (result === 'loss') {
        return <InProgressAfterPgnText />;
    }
    return null;
}
