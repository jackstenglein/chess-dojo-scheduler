import { useReconcile } from '@/board/Board';
import { LineEval } from '@/stockfish/engine/engine';
import { Chess, Color, Move } from '@jackstenglein/chess';
import { Box, ListItem, Skeleton, styled, Typography } from '@mui/material';
import { useChess } from '../../PgnBoard';

interface Props {
    line: LineEval;
}

export default function LineEvaluation({ line }: Props) {
    const lineLabel = getLineEvalLabel(line);
    const { chess } = useChess();
    const reconcile = useReconcile();

    const isBlackCp =
        (line.cp !== undefined && line.cp < 0) ||
        (line.mate !== undefined && line.mate < 0);

    const showSkeleton = line.depth < 6;

    const onClick = (index: number) => {
        if (chess?.fen() !== line.fen || index >= line.pv.length) {
            return;
        }

        let existingOnly = true;
        for (let i = 0; i <= index; i++) {
            const move = chess.move(line.pv[i], { existingOnly });
            if (move === null) {
                existingOnly = false;
                i--;
            } else if (!existingOnly) {
                chess.setCommand('dojoEngine', 'true', move);
            }
        }
        reconcile();
    };

    return (
        <ListItem disablePadding sx={{ overflowX: 'clip', alignItems: 'center' }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mr: 0.5,
                    my: 0.5,
                    py: '1px',
                    backgroundColor: isBlackCp ? 'black' : 'white',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: '#424242',
                    width: '45px',
                    minWidth: '45px',
                    height: '23px',
                    minHeight: '23px',
                }}
            >
                {showSkeleton ? (
                    <Skeleton
                        variant='rounded'
                        animation='wave'
                        sx={{ color: 'transparent' }}
                    >
                        placeholder
                    </Skeleton>
                ) : (
                    <Typography
                        component='span'
                        sx={{
                            pt: '2px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: isBlackCp ? 'white' : 'black',
                        }}
                    >
                        {lineLabel}
                    </Typography>
                )}
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {showSkeleton ? (
                    <Skeleton variant='rounded' animation='wave' />
                ) : (
                    line.pv.map(moveLineUciToMove(line.fen)).map((move, idx) => {
                        if (!move) {
                            return null;
                        }

                        return (
                            <MoveLabel
                                key={idx}
                                data-index={idx}
                                data-fen={move.after}
                                data-from={move.from}
                                data-to={move.to}
                                onClick={() => onClick(idx)}
                            >
                                {moveToLabel(move)}
                            </MoveLabel>
                        );
                    })
                )}
            </Box>
        </ListItem>
    );
}

const MoveLabel = styled('span')(({ theme }) => ({
    textWrap: 'nowrap',
    marginLeft: '6px',
    fontSize: '0.9rem',
    '&:hover': {
        color: theme.palette.primary.main,
        cursor: 'pointer',
    },
}));

/**
 * Gets the evaluation label (Ex: +2.3, -1, M5) for the given line.
 * @param line The line to get the evaluation label for.
 * @returns The evaluation label.
 */
export const getLineEvalLabel = (line: Pick<LineEval, 'cp' | 'mate'>): string => {
    if (line.cp !== undefined) {
        return `${line.cp > 0 ? '+' : ''}${(line.cp / 100).toFixed(2)}`;
    }

    if (line.mate) {
        return `${line.mate > 0 ? '+' : '-'}M${Math.abs(line.mate)}`;
    }

    return '?';
};

/**
 * Returns a function that converts a UCI to a Move object. The function
 * must be called in order on each UCI.
 * @param fen The starting position FEN.
 * @returns A function that converts a UCI to a Move.
 */
function moveLineUciToMove(fen: string): (moveUci: string) => Move | null {
    const game = new Chess({ fen });

    return (moveUci: string) => {
        try {
            const move = game.move(moveUci);
            return move;
        } catch (e) {
            console.error(`Failed to convert UCI ${moveUci}: `, e);
            return null;
        }
    };
}

/**
 * Gets the user-facing display label from the given Move.
 * @param move The Move to get the label for.
 * @returns The label for the Move.
 */
function moveToLabel(move: Move): string {
    let label = '';
    if (!move.previous || move.color === Color.white) {
        label = `${Math.ceil(move.ply / 2)}.`;
        if (move.color === Color.black) {
            label += '..';
        }
        label += ' ';
    }

    label += move.san;
    return label;
}
