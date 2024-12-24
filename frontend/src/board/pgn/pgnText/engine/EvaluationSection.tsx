import Board from '@/board/Board';
import { ChessContext, useChess } from '@/board/pgn/PgnBoard';
import { EngineInfo, LineEval } from '@/stockfish/engine/engine';
import { List, Paper, Popper } from '@mui/material';
import { Key } from 'chessground/types';
import { useRef, useState } from 'react';
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
                    <LineEvaluation engineInfo={engineInfo} key={i} line={allLines[i]} />
                ))}
            </List>
            <Popper
                open={Boolean(anchorRef.current && hoverMove)}
                anchorEl={anchorRef.current}
                placement={'bottom'}
                sx={{ zIndex: '1300' }}
            >
                {hoverMove && (
                    <Paper
                        elevation={12}
                        sx={{
                            width:
                                Math.floor(
                                    (anchorRef.current?.getBoundingClientRect().width ??
                                        0) / 4,
                                ) * 4,
                            maxWidth: '368px',
                            aspectRatio: '1 / 1',
                            overflow: 'hidden',
                        }}
                    >
                        <ChessContext.Provider
                            value={{ config: { initKey: hoverMove.fen } }}
                        >
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
