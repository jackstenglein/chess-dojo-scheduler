import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Chess, Move } from '@jackstenglein/chess';

import Board, { BoardApi, toColor, toDests } from '../Board';
import PgnText from './PgnText';

interface PgnBoardProps {
    pgn: string;
}

const PgnBoard: React.FC<PgnBoardProps> = ({ pgn }) => {
    const [board, setBoard] = useState<BoardApi>();
    const [chess, setChess] = useState<Chess>();
    const [move, setMove] = useState<Move | null>(null);

    const onInitialize = (board: BoardApi, chess: Chess) => {
        chess.loadPgn(pgn);
        chess.seek(null);
        board.set({
            fen: chess.fen(),
            turnColor: toColor(chess),
            movable: {
                color: toColor(chess),
                dests: toDests(chess),
                events: {
                    after: onMove(board, chess),
                },
                free: false,
            },
            premovable: {
                enabled: false,
            },
        });
        setBoard(board);
        setChess(chess);
    };

    const onMove = (board: BoardApi, chess: Chess) => {
        return (from: string, to: string) => {
            const move = chess.move({ from, to });
            board.set({
                fen: chess.fen(),
                turnColor: toColor(chess),
                movable: {
                    color: toColor(chess),
                    dests: toDests(chess),
                },
            });
            setMove(move);
        };
    };

    const onClickMove = (move: Move) => {
        chess?.seek(move);
        board?.set({
            fen: chess?.fen(),
            turnColor: toColor(chess),
            lastMove: [move.from, move.to],
            movable: {
                color: toColor(chess),
                dests: toDests(chess),
            },
        });
        setMove(move);
    };

    return (
        <Box
            sx={{
                display: 'grid',
                width: 1,
                '--zoom': 85,
                '--site-header-height': '80px',
                '--site-header-margin': 0,
                '--board-scale': 'calc((var(--zoom) / 100) * 0.75 + 0.25)',
                '--gap': '16px',
                '--main-margin': '1vw',
                '--col2-board-width':
                    'calc(min(calc( 100vw - 16px - 260px ), calc(100vh - 80px - 1rem)) * var(--board-scale))',
                '--tools-width':
                    'calc(max(200px, min(70vw - var(--col2-board-width) - var(--gap), 400px)))',
                gridTemplateRows: {
                    xs: 'auto auto var(--gap) minmax(20em, 30vh)',
                    sm: 'fit-content(0) var(--col2-board-width)',
                },
                gridTemplateColumns: {
                    xs: undefined,
                    sm: 'var(--col2-board-width) var(--gap) var(--tools-width)',
                },
                gridTemplateAreas: {
                    xs: '"header" "board" "gap" "coach"',
                    sm: '"header header header" "board gap coach"',
                },
            }}
        >
            {board && chess && (
                <Typography gridArea='header' variant='subtitle2' color='text.secondary'>
                    {chess.pgn.header.tags.White} vs {chess.pgn.header.tags.Black}
                </Typography>
            )}
            <Box
                gridArea='board'
                sx={{
                    aspectRatio: 1,
                    width: 1,
                }}
            >
                <Board onInitialize={onInitialize} onMove={onMove} />
            </Box>
            {board && chess && (
                <Stack
                    gridArea='coach'
                    height={1}
                    justifyContent={{ xs: 'start', sm: 'flex-end' }}
                >
                    <PgnText
                        pgn={chess.pgn}
                        currentMove={move}
                        onClickMove={onClickMove}
                    />
                </Stack>
            )}
        </Box>
    );
};

export default PgnBoard;
