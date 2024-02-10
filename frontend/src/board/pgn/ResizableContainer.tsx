import { Stack } from '@mui/material';
import { Color } from 'chessground/types';
import { Move } from '@jackstenglein/chess';

import Underboard from './boardTools/underboard/Underboard';
import ResizableBoardArea from './ResizableBoardArea';
import { ResizablePgnText } from './pgnText/PgnText';
import { Game } from '../../database/game';
import { BoardApi, Chess, PrimitiveMove } from '../Board';
import { useCallback, useEffect, useState } from 'react';
import { getSizes } from './resize';

export const CONTAINER_ID = 'resize-container';

interface ResizableContainerProps {
    showUnderboard?: boolean;
    showExplorer?: boolean;
    game?: Game;
    onSaveGame?: (g: Game) => void;

    pgn?: string;
    fen?: string;
    showPlayerHeaders?: boolean;
    startOrientation?: Color;
    showEditor?: boolean;
    onInitialize: (board: BoardApi, chess: Chess) => void;
    onMove: (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => void;
    onClickMove: (move: Move | null) => void;
}

const ResizableContainer: React.FC<ResizableContainerProps> = ({
    showUnderboard,
    showExplorer,
    game,
    onSaveGame,
    showPlayerHeaders,
    pgn,
    fen,
    startOrientation,
    showEditor,
    onInitialize,
    onMove,
    onClickMove,
}) => {
    const parentWidth =
        document.getElementById(CONTAINER_ID)?.getBoundingClientRect().width || 0;
    const [sizes, setSizes] = useState(getSizes(parentWidth));

    useEffect(() => {
        console.log('Use Effect: ', parentWidth);
        setSizes(getSizes(parentWidth));
    }, [parentWidth, setSizes]);

    const onResize = useCallback(
        (area: 'board' | 'underboard' | 'pgn') => (width: number, height: number) => {
            setSizes((sizes) => ({ ...sizes, [area]: { width, height } }));
        },
        [setSizes]
    );

    return (
        <Stack
            direction='row'
            width={1}
            maxWidth={1}
            spacing={{ xs: 0, sm: 0 }}
            justifyContent='center'
            px={{ xs: 0, sm: 0 }}
            flexWrap='wrap'
            rowGap={0.5}
            columnGap={{ xs: 0.5, md: 2 }}
        >
            {showUnderboard && (
                <Underboard
                    showExplorer={showExplorer}
                    game={game}
                    onSaveGame={onSaveGame}
                    resizeData={sizes.underboard}
                    onResize={onResize('underboard')}
                />
            )}

            <ResizableBoardArea
                {...{
                    width: sizes.board.width,
                    onResize: onResize('board'),
                    showPlayerHeaders,
                    pgn,
                    fen,
                    startOrientation,
                    game,
                    showEditor,
                    onInitialize,
                    onMove,
                    onClickMove,
                }}
            />

            <ResizablePgnText
                width={sizes.pgn.width}
                height={sizes.pgn.height}
                onResize={onResize('pgn')}
                onClickMove={onClickMove}
            />
        </Stack>
    );
};

export default ResizableContainer;
