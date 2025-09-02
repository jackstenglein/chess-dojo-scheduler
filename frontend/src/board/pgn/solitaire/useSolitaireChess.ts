import { BoardApi, defaultOnMove, PrimitiveMove, reconcile } from '@/board/Board';
import { ShowGlyphsKey } from '@/board/pgn/boardTools/underboard/settings/ViewerSettings';
import {
    correctMoveGlyphHtml,
    incorrectMoveGlyphHtml,
} from '@/components/material/memorizegames/moveGlyphs';
import { Chess, Move, Square } from '@jackstenglein/chess';
import { RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

interface WrongMove {
    from: Square;
    to: Square;
    promotion?: string | undefined;
}

export type PlayAs = 'both' | 'white' | 'black';

export interface UseSolitareChessResponse {
    /** Whether solitaire mode is enabled. */
    enabled: boolean;
    /** Which colors to play as. */
    playAs: PlayAs;
    /** Sets which colors to play as. */
    setPlayAs: (v: PlayAs) => void;
    /** Whether to add wrong moves to the PGN after the correct move is played. */
    addWrongMoves: boolean;
    /** Sets whether to add wrong moves to the PGN. */
    setAddWrongMoves: (v: boolean) => void;
    /** Whether solitare mode has been completed. */
    complete: boolean;
    /** The last correctly guessed move. */
    currentMove: Move | null;
    /** A callback to start solitaire mode from the given move. */
    start: (move: Move | null) => void;
    /** A callback to stop solitaire mode. */
    stop: () => void;
    /** A callback to invoke when the user makes a move on the board. */
    onMove: (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => void;
}

export function useSolitaireChess(
    chess: Chess,
    board: BoardApi | undefined,
): UseSolitareChessResponse {
    const [enabled, setEnabled] = useState(false);
    const [playAs, setPlayAs] = useState<PlayAs>('both');
    const [addWrongMoves, setAddWrongMoves] = useState(true);
    const [showGlyphs] = useLocalStorage(ShowGlyphsKey, false);
    const [currentMove, setCurrentMove] = useState<Move | null>(null);
    const lastMove = useRef<Move | null>(null);
    const incorrectMoves = useRef<WrongMove[]>([]);

    const start = useCallback(
        (move: Move | null) => {
            chess.seek(move);
            reconcile(chess, board, showGlyphs);
            incorrectMoves.current = [];
            setCurrentMove(move);
            setEnabled(true);
            lastMove.current = chess.lastMove();
            if (playAs !== 'both' && chess.turn(move) !== playAs[0] && chess.nextMove(move)) {
                waitForOpponentMove({
                    chess,
                    board,
                    showGlyphs,
                    move: chess.nextMove(move),
                    setCurrentMove,
                });
            }
        },
        [setEnabled, chess, board, showGlyphs, playAs],
    );

    const stop = useCallback(() => {
        setEnabled(false);
    }, [setEnabled]);

    const onMove = useCallback(
        (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => {
            if (
                currentMove &&
                (chess.currentMove() !== currentMove || currentMove === lastMove.current)
            ) {
                // If the user goes back in the game, we let them analyze freely
                defaultOnMove(showGlyphs)(board, chess, primMove);
                return;
            }

            const move = { from: primMove.orig, to: primMove.dest, promotion: primMove.promotion };
            if (chess.isMainline(move)) {
                handleCorrectMove({
                    chess,
                    board,
                    showGlyphs,
                    playAs,
                    move,
                    addWrongMoves,
                    incorrectMoves,
                    currentMove,
                    setCurrentMove,
                });
                return;
            }

            incorrectMoves.current.push(move);
            board.set({
                movable: {},
                premovable: {
                    enabled: false,
                },
                drawable: {
                    autoShapes: [{ orig: move.to, customSvg: { html: incorrectMoveGlyphHtml } }],
                    eraseOnClick: false,
                },
            });
            setTimeout(() => {
                reconcile(chess, board, showGlyphs);
            }, 500);
        },
        [showGlyphs, addWrongMoves, currentMove, playAs],
    );

    return useMemo(
        () => ({
            enabled,
            playAs,
            setPlayAs,
            addWrongMoves,
            setAddWrongMoves,
            complete: currentMove === lastMove.current,
            currentMove,
            start,
            stop,
            onMove,
        }),
        [addWrongMoves, enabled, onMove, start, stop, currentMove, playAs],
    );
}

function handleCorrectMove({
    chess,
    board,
    showGlyphs,
    playAs,
    move,
    addWrongMoves,
    incorrectMoves,
    currentMove,
    setCurrentMove,
}: {
    chess: Chess;
    board: BoardApi;
    showGlyphs: boolean;
    playAs: PlayAs;
    move: WrongMove;
    addWrongMoves: boolean;
    incorrectMoves: RefObject<WrongMove[]>;
    currentMove: Move | null;
    setCurrentMove: (v: Move | null) => void;
}) {
    const nextMove = chess.move(move);
    if (addWrongMoves) {
        for (const m of incorrectMoves.current) {
            chess.move(m, { previousMove: currentMove, skipSeek: true });
        }
    }

    incorrectMoves.current = [];
    reconcile(chess, board, showGlyphs);
    board.set({
        drawable: {
            autoShapes: [{ orig: move.to, customSvg: { html: correctMoveGlyphHtml } }],
        },
    });
    const isComplete = nextMove === chess.history().at(-1);
    if (!isComplete && playAs !== 'both') {
        waitForOpponentMove({
            chess,
            board,
            showGlyphs,
            move: nextMove?.next ?? null,
            setCurrentMove,
        });
    } else {
        setCurrentMove(nextMove);
    }
}

function waitForOpponentMove({
    chess,
    board,
    showGlyphs,
    move,
    setCurrentMove,
}: {
    chess: Chess;
    board: BoardApi | undefined;
    showGlyphs: boolean;
    move: Move | null;
    setCurrentMove: (v: Move | null) => void;
}) {
    board?.set({
        movable: {},
        premovable: { enabled: false },
    });
    setCurrentMove(move);
    setTimeout(() => {
        chess.seek(move);
        reconcile(chess, board, showGlyphs);
    }, 500);
}
