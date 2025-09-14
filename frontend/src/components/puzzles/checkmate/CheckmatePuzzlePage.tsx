'use client';

import { getPieceSx } from '@/board/boardThemes';
import { formatTime } from '@/board/pgn/boardTools/underboard/clock/ClockUsage';
import {
    PieceStyle,
    PieceStyleKey,
} from '@/board/pgn/boardTools/underboard/settings/ViewerSettings';
import PgnBoard, { PgnBoardApi, useChess } from '@/board/pgn/PgnBoard';
import { InProgressAfterPgnText } from '@/board/pgn/solitaire/SolitaireAfterPgnText';
import MultipleSelectChip from '@/components/ui/MultipleSelectChip';
import { Chess, Color } from '@jackstenglein/chess';
import { AccessTime, Help, Info, Timeline } from '@mui/icons-material';
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
    Tooltip,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCountdown, useLocalStorage } from 'usehooks-ts';

const RATED_KEY = 'puzzles.rated';
const SHOW_TIMER_KEY = 'puzzles.showTimer';
const SHOW_RATING_KEY = 'puzzles.showRating';

interface Puzzle {
    fen: string;
    moves: string[];
    rating: number;
    lichessPlays: number;
    successfulPlays: number;
}

const puzzles: Puzzle[] = [
    {
        fen: '4r3/1k6/pp3r2/1b2P2p/3R1p2/P1R2P2/1P4PP/6K1 w - - 0 35',
        moves: 'e5f6 e8e1 g1f2 e1f1'.split(' '),
        rating: 1353,
        lichessPlays: 631,
        successfulPlays: 303,
    },
    {
        fen: 'r1bqk2r/pp1nbNp1/2p1p2p/8/2BP4/1PN3P1/P3QP1P/3R1RK1 b kq - 0 19',
        moves: 'e8f7 e2e6 f7f8 e6f7'.split(' '),
        rating: 1508,
        lichessPlays: 641,
        successfulPlays: 500,
    },
    {
        fen: '4r1k1/5ppp/r1p5/p1n1RP2/8/2P2N1P/2P3P1/3R2K1 b - - 0 21',
        moves: 'e8e5 d1d8 e5e8 d8e8'.split(' '),
        rating: 1120,
        lichessPlays: 80,
        successfulPlays: 20,
    },
    {
        fen: '5r1k/pp4pp/5p2/1BbQp1r1/6K1/7P/1PP3P1/3R3R w - - 2 26',
        moves: 'g4h4 c5f2 g2g3 f2g3'.split(' '),
        rating: 1018,
        lichessPlays: 224,
        successfulPlays: 100,
    },
    {
        fen: '1rb2rk1/q5P1/4p2p/3p3p/3P1P2/2P5/2QK3P/3R2R1 b - - 0 29',
        moves: 'f8f7 c2h7 g8h7 g7g8q'.split(' '),
        rating: 1039,
        lichessPlays: 211,
        successfulPlays: 200,
    },
];

export function CheckmatePuzzlePage() {
    const pgnRef = useRef<PgnBoardApi>(null);
    const [puzzleIndex, setPuzzleIndex] = useState(0);
    const [seconds, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
        isIncrement: true,
        countStart: 0,
        countStop: -1,
    });
    const [result, setResult] = useState<'win' | 'loss'>();
    const [complete, setComplete] = useState(false);
    const [currentRating, setCurrentRating] = useState(1505);

    useEffect(() => {
        startCountdown();
    }, [startCountdown]);

    const currentPuzzle = puzzles[puzzleIndex];

    const [puzzlePGN, playerColor] = useMemo(() => {
        const puzzle = puzzles[puzzleIndex];
        const chess = new Chess({ fen: puzzle.fen });
        for (const move of puzzle.moves) {
            chess.move(move);
        }
        return [chess.renderPgn(), chess.history()[1].color];
    }, [puzzleIndex]);
    const orientation = playerColor === Color.white ? 'white' : 'black';

    const ratingChange = result === 'win' ? 10 : result === 'loss' ? -10 : 0;

    const onNextPuzzle = () => {
        setCurrentRating((r) => r + ratingChange);
        setResult(undefined);
        setComplete(false);
        setPuzzleIndex((i) => (i + 1) % puzzles.length);
        resetCountdown();
        startCountdown();
    };

    const onWrongMove = () => {
        setResult('loss');
    };

    const onComplete = () => {
        stopCountdown();
        setResult((r) => r ?? 'win');
        setComplete(true);
    };

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <PgnBoard
                ref={pgnRef}
                key={currentPuzzle.fen}
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

function CheckmatePuzzleUnderboard({
    puzzle,
    seconds,
    orientation,
    currentRating,
    ratingChange,
}: {
    /** The puzzle the user is playing. */
    puzzle: Puzzle;
    /** The number of seconds the user has been working on the puzzle. */
    seconds: number;
    /** The color the user is playing. */
    orientation: 'white' | 'black';
    /** The user's rating before taking the puzzle. */
    currentRating: number;
    /** The user's rating change after taking the puzzle. */
    ratingChange: number;
}) {
    const { solitaire } = useChess();
    const [rated, setRated] = useLocalStorage(RATED_KEY, true);
    const [showTimer, setShowTimer] = useLocalStorage(SHOW_TIMER_KEY, true);
    const [showRating, setShowRating] = useLocalStorage(SHOW_RATING_KEY, true);

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
                            Mate in 2
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
                            <PuzzleDetailRow label='Puzzle Rating' value={puzzle.rating} />
                        )}
                        <PuzzleDetailRow label='Total Attempts' value={puzzle.lichessPlays} />
                        <PuzzleDetailRow
                            label='Successful Attempts'
                            value={`${puzzle.successfulPlays} (${Math.round((1000 * puzzle.successfulPlays) / puzzle.lichessPlays) / 10}%)`}
                        />
                        <PuzzleDetailRow label='Target Time' value='1:00' />
                        <PuzzleDetailRow label='Used Time' value={formatTime(seconds)} />
                    </Stack>
                )}

                <Stack sx={{ flexGrow: 1, justifyContent: 'end' }}>
                    <MultipleSelectChip
                        label='Themes'
                        selected={['mateIn1', 'mateIn2', 'mateIn3']}
                        setSelected={() => null}
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
                        value='standard'
                        size='small'
                        sx={{ mb: 1 }}
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
                    <FormControlLabel
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
                    />
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
