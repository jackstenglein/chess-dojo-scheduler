import Board from '@/board/Board';
import { EngineInfo, LineEval } from '@/stockfish/engine/engine';
import { useChessDB, ChessDbPv } from '@/stockfish/hooks/useChessDb';
import { List, Paper, Popper, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { Key } from 'chessground/types';
import { useRef, useState } from 'react';
import { ChessContext, useChess } from '../../PgnBoard';
import LineEvaluation from './LineEval';

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
            </List>

            <CloudEvalSection pv={pv} loading={pvLoading} />

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

function CloudEvalSection({ pv, loading }: { pv: ChessDbPv | null; loading: boolean }) {
    const scoreNum = pv?.score ?? 0;
    const isBlack = scoreNum < 0;
    const scoreLabel = isNaN(scoreNum)
        ? '?'
        : `${scoreNum > 0 ? '+' : ''}${(scoreNum / 100).toFixed(2)}`;

    return (
        <Stack
            direction='row'
            alignItems='center'
            spacing={1}
            sx={{
                mt: 0.5,
                pt: 0.5,
                borderTop: '1px solid',
                borderTopColor: 'divider',
                minHeight: '28px',
            }}
        >
            <Tooltip title='Chess Cloud Database evaluation' disableInteractive>
                <Typography
                    variant='caption'
                    sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontStyle: 'italic' }}
                >
                    CDB
                </Typography>
            </Tooltip>

            {loading ? (
                <Skeleton variant='rounded' animation='wave' width={240} height={18} />
            ) : !pv ? (
                <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                    Not in cloud database
                </Typography>
            ) : (
                <>
                    <Tooltip title={`Depth ${pv.depth}`} disableInteractive>
                        <Stack
                            alignItems='center'
                            justifyContent='center'
                            sx={{
                                px: 0.75,
                                py: '1px',
                                minWidth: '45px',
                                height: '23px',
                                backgroundColor: isBlack ? 'black' : 'white',
                                borderRadius: '5px',
                                border: '1px solid',
                                borderColor: '#424242',
                                cursor: 'default',
                            }}
                        >
                            <Typography
                                component='span'
                                sx={{
                                    pt: '2px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    color: isBlack ? 'white' : 'black',
                                }}
                            >
                                {scoreLabel}
                            </Typography>
                        </Stack>
                    </Tooltip>

                    <Typography
                        variant='caption'
                        sx={{
                            flexGrow: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.9rem',
                        }}
                    >
                        {pv.pvSAN.slice(0, 10).join(' ')}
                    </Typography>
                </>
            )}
        </Stack>
    );
}