import { useReconcile } from '@/board/Board';
import {
    ENGINE_ADD_INFO_ON_EVAL_CLICK,
    ENGINE_ADD_INFO_ON_MOVE_CLICK,
    ENGINE_PRIMARY_EVAL_TYPE,
    EngineInfo,
    LineEval,
    PrimaryEvalType,
} from '@/stockfish/engine/engine';
import { Chess, Color, Move } from '@jackstenglein/chess';
import { Box, ListItem, Skeleton, styled, Typography } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';
import { useChess } from '../../PgnBoard';

interface Props {
    line: LineEval;
    engineInfo: EngineInfo;
}

export default function LineEvaluation({ engineInfo, line }: Props) {
    const { chess } = useChess();
    const reconcile = useReconcile();
    const [primaryEvalType] = useLocalStorage<PrimaryEvalType>(
        ENGINE_PRIMARY_EVAL_TYPE.Key,
        ENGINE_PRIMARY_EVAL_TYPE.Default as PrimaryEvalType,
    );
    const [addInfoOnEval] = useLocalStorage(
        ENGINE_ADD_INFO_ON_EVAL_CLICK.Key,
        ENGINE_ADD_INFO_ON_EVAL_CLICK.Default,
    );
    const [addInfoOnMove] = useLocalStorage(
        ENGINE_ADD_INFO_ON_MOVE_CLICK.Key,
        ENGINE_ADD_INFO_ON_MOVE_CLICK.Default,
    );

    const evaluation = formatLineEval(line);
    const wdl = formatResultPercentages(Color.white, Color.white, line, ' ');

    const isBlackCp =
        (line.cp !== undefined && line.cp < 0) ||
        (line.mate !== undefined && line.mate < 0);

    const showSkeleton = line.depth === 0 || line.fen !== chess?.fen();
    const moves = line.pv.map(moveLineUciToMove(line.fen));

    const onClick = (index: number, addInfo: boolean = addInfoOnMove) => {
        if (chess?.fen() !== line.fen || index >= line.pv.length) {
            return;
        }

        const startTurn = chess.turn();
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
        if (addInfo) {
            let comment = chess.getComment();
            if (comment.trim().length > 0) {
                comment += `\n\n`;
            }
            comment += `(${engineInfo.extraShortName} ${evaluation}/${line.depth}`;
            comment += formatResultPercentages(startTurn, chess.turn(), line);
            comment += ')';
            chess.setComment(comment);
        }
        reconcile();
    };

    const onClickEval = () => {
        if (line.pv.length > 0) {
            onClick(line.pv.length - 1, addInfoOnEval);
        }
    };

    return (
        <ListItem disablePadding sx={{ overflowX: 'clip', alignItems: 'center' }}>
            <Box
                onClick={onClickEval}
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
                    height: '23px',
                    minHeight: '23px',
                    cursor: 'pointer',
                    '&:hover': {
                        opacity: 0.85,
                    },
                    ...(primaryEvalType === PrimaryEvalType.Eval
                        ? {
                              width: '45px',
                              minWidth: '45px',
                          }
                        : {
                              px: 0.5,
                              whiteSpace: 'nowrap',
                          }),
                }}
                data-fen={moves.at(-1)?.after}
                data-from={moves.at(-1)?.from}
                data-to={moves.at(-1)?.to}
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
                        data-fen={moves.at(-1)?.after}
                        data-from={moves.at(-1)?.from}
                        data-to={moves.at(-1)?.to}
                    >
                        {primaryEvalType === PrimaryEvalType.Eval ? evaluation : wdl}
                    </Typography>
                )}
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {showSkeleton ? (
                    <Skeleton variant='rounded' animation='wave' />
                ) : (
                    moves.map((move, idx) => {
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
export const formatLineEval = (line: Pick<LineEval, 'cp' | 'mate'>): string => {
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

function formatResultPercentages(
    startTurn: Color,
    currentTurn: Color,
    line: LineEval,
    separator = '',
): string {
    if (!line.resultPercentages) {
        return '';
    }
    if (startTurn === currentTurn) {
        return ` ${line.resultPercentages.win}${separator}/${separator}${line.resultPercentages.draw}${separator}/${separator}${line.resultPercentages.loss}`;
    }
    return ` ${line.resultPercentages.loss}${separator}/${separator}${line.resultPercentages.draw}${separator}/${separator}${line.resultPercentages.win}`;
}
