import Board from '@/board/Board';
import { logger } from '@/logging/logger';
import { EngineInfo, LineEval } from '@/stockfish/engine/engine';
import { CLOUD_EVAL_ENABLED } from '@/stockfish/engine/engine';
import { ChessDbPv, useChessDB } from '@/stockfish/hooks/useChessDb';
import { Chess, Color, Move } from '@jackstenglein/chess';
import { Box, List, ListItem, Paper, Popper, Skeleton, styled, Tooltip, Typography } from '@mui/material';
import { Key } from 'chessground/types';
import { useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { ChessContext, useChess } from '../../PgnBoard';
import LineEvaluation from './LineEval';
import { useReconcile } from '@/board/Board';

interface HoverMove {
    fen: string;
    from: Key;
    to: Key;
}

export const EvaluationSection = ({
    engineInfo,
    allLines,
    maxLines,
}: {
    engineInfo: EngineInfo;
    allLines: LineEval[];
    maxLines: number;
}) => {
    const anchorRef = useRef<HTMLUListElement>(null);
    const [hoverMove, setHoverMove] = useState<HoverMove>();
    const { board } = useChess();
    const { pv, pvLoading } = useChessDB();
    const [cloudEvalEnabled] = useLocalStorage(CLOUD_EVAL_ENABLED.Key, CLOUD_EVAL_ENABLED.Default);

    const onMouseOver = (event: React.MouseEvent<HTMLElement>) => {
        const element = event.target as HTMLElement;
        if (element.dataset.fen && element.dataset.from && element.dataset.to) {
            setHoverMove({
                fen: element.dataset.fen,
                from: element.dataset.from as Key,
                to: element.dataset.to as Key,
            });
        }
    };

    const onMouseLeave = () => {
        setHoverMove(undefined);
    };

    return (
        <>
            <List
                ref={anchorRef}
                sx={{ pb: 0 }}
                onMouseOver={onMouseOver}
                onMouseLeave={onMouseLeave}
            >
                {Array.from({ length: maxLines }).map((_, i) => (
                    <LineEvaluation engineInfo={engineInfo} key={i} line={allLines[i]} isTop={i === 0} />
                ))}
                {cloudEvalEnabled && <CloudEvalSection pv={pv} loading={pvLoading} />}
            </List>

            <Popper
                open={Boolean(anchorRef.current && hoverMove)}
                anchorEl={anchorRef.current}
                placement='bottom'
                sx={{ zIndex: '1300' }}
            >
                {hoverMove && (
                    <Paper
                        elevation={12}
                        sx={{
                            width:
                                Math.floor(
                                    (anchorRef.current?.getBoundingClientRect().width ?? 0) / 4,
                                ) * 4,
                            maxWidth: '368px',
                            aspectRatio: '1 / 1',
                            overflow: 'hidden',
                        }}
                    >
                        <ChessContext.Provider value={{ config: { initKey: hoverMove.fen } }}>
                            <Board
                                config={{
                                    fen: hoverMove.fen,
                                    lastMove: [hoverMove.from, hoverMove.to],
                                    viewOnly: true,
                                    orientation: board?.state.orientation,
                                }}
                            />
                        </ChessContext.Provider>
                    </Paper>
                )}
            </Popper>
        </>
    );
};

const CloudMoveLabel = styled('span')(({ theme }) => ({
    textWrap: 'nowrap',
    marginLeft: '6px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    '&:hover': {
        color: theme.palette.primary.main,
    },
}));

function cloudPvToMoves(fen: string, pvUci: string[]): (Move | null)[] {
    const game = new Chess({ fen });
    return pvUci.map((uci) => {
        try {
            return game.move(uci);
        } catch (e) {
            logger.error?.(`CDB: Failed to convert UCI ${uci}: `, e);
            return null;
        }
    });
}

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

function CloudEvalSection({ pv, loading }: { pv: ChessDbPv | null; loading: boolean }) {
    const { chess } = useChess();
    const reconcile = useReconcile();
    const currentFen = chess?.fen() ?? '';

    const scoreNum = pv?.score ?? 0;
    const isBlack = scoreNum < 0;
    const scoreLabel = !pv
        ? '?'
        : `${scoreNum > 0 ? '+' : ''}${(scoreNum / 100).toFixed(2)}`;

    const moves = pv && currentFen ? cloudPvToMoves(currentFen, pv.pv) : [];
    const lastMove = moves.filter(Boolean).at(-1);

    const addCloudMove = (index: number) => {
        if (!chess || !pv || currentFen !== chess.fen()) return;

        let existingOnly = true;
        for (let i = 0; i <= index; i++) {
            const move = chess.move(pv.pv[i], { existingOnly });
            if (move === null) {
                existingOnly = false;
                i--;
            } else if (!existingOnly) {
                chess.setCommand('dojoEngine', 'true', move);
            }
        }

        reconcile();
    };

    const onClickEval = () => {
        if (pv && pv.pv.length > 0) {
            addCloudMove(pv.pv.length - 1);
        }
    };

    return (
        <ListItem
            disablePadding
            sx={{
                overflowX: 'clip',
                alignItems: 'center',
                mt: 0.5,
                pt: 0.5,
                borderTop: '1px solid',
                borderTopColor: 'divider',
                minHeight: '31px',
            }}
        >
            <Tooltip title='Chess Cloud Database' disableInteractive>
                <Typography
                    variant='caption'
                    sx={{
                        color: 'text.secondary',
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                        mr: 0.5,
                        fontSize: '0.75rem',
                    }}
                >
                    CDB
                </Typography>
            </Tooltip>

            {loading ? (
                <>
                    <Skeleton
                        variant='rounded'
                        animation='wave'
                        sx={{ color: 'transparent', mr: 0.5, minWidth: '45px', height: '23px' }}
                    >
                        placeholder
                    </Skeleton>
                    <Skeleton variant='rounded' animation='wave' sx={{ flexGrow: 1 }} />
                </>
            ) : !pv ? (
                <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                    Not in cloud database
                </Typography>
            ) : (
                <>
                    <Tooltip title={`Depth ${pv.depth}`} disableInteractive>
                        <Box
                            onClick={onClickEval}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mr: 0.5,
                                my: 0.5,
                                py: '1px',
                                width: '45px',
                                minWidth: '45px',
                                height: '23px',
                                minHeight: '23px',
                                backgroundColor: isBlack ? 'black' : 'white',
                                borderRadius: '5px',
                                border: '1px solid',
                                borderColor: '#424242',
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.85 },
                            }}
                            data-fen={lastMove?.after}
                            data-from={lastMove?.from}
                            data-to={lastMove?.to}
                        >
                            <Typography
                                component='span'
                                sx={{
                                    pt: '2px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    color: isBlack ? 'white' : 'black',
                                }}
                                data-fen={lastMove?.after}
                                data-from={lastMove?.from}
                                data-to={lastMove?.to}
                            >
                                {scoreLabel}
                            </Typography>
                        </Box>
                    </Tooltip>

                    <Box sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {moves.map((move, idx) => {
                            if (!move) return null;
                            return (
                                <CloudMoveLabel
                                    key={idx}
                                    data-fen={move.after}
                                    data-from={move.from}
                                    data-to={move.to}
                                    onClick={() => addCloudMove(idx)}
                                >
                                    {moveToLabel(move)}
                                </CloudMoveLabel>
                            );
                        })}
                    </Box>
                </>
            )}
        </ListItem>
    );
}