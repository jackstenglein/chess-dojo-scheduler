import { Stack } from '@mui/material';
import { Color } from 'chessground/types';
import { Move } from '@jackstenglein/chess';
import 'react-resizable/css/styles.css';

import Underboard from './boardTools/underboard/Underboard';
import ResizableBoardArea from './ResizableBoardArea';
import { ResizablePgnText } from './pgnText/PgnText';
import { Game } from '../../database/game';
import { BoardApi, Chess, PrimitiveMove } from '../Board';
import { useCallback, useEffect, useState } from 'react';
import { getNewSizes, getSizes } from './resize';
import { useWindowSizeEffect } from '../../ThemeProvider';

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
    const [sizes, setSizes] = useState(
        getSizes(parentWidth, showUnderboard, !showPlayerHeaders)
    );

    useEffect(() => {
        setSizes(getSizes(parentWidth, showUnderboard, !showPlayerHeaders));
    }, [parentWidth, setSizes, showUnderboard, showPlayerHeaders]);

    const onWindowResize = useCallback(() => {
        const parentWidth =
            document.getElementById(CONTAINER_ID)?.getBoundingClientRect().width || 0;
        setSizes(getSizes(parentWidth, showUnderboard, !showPlayerHeaders));
    }, [setSizes, showUnderboard, showPlayerHeaders]);

    useWindowSizeEffect(onWindowResize);

    const onResize = useCallback(
        (area: 'board' | 'underboard' | 'pgn') => (width: number, height: number) => {
            setSizes((sizes) =>
                getNewSizes(
                    {
                        ...sizes,
                        [area]: { ...sizes[area], width, height },
                    },
                    !showPlayerHeaders
                )
            );
        },
        [setSizes, showPlayerHeaders]
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
            columnGap={{ xs: 0.5, md: 1, lg: 1 }}
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
                    resizeData: sizes.board,
                    onResize: onResize('board'),
                    hideResize: sizes.breakpoint === 'xs',
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
                resizeData={sizes.pgn}
                onResize={onResize('pgn')}
                onClickMove={onClickMove}
            />
        </Stack>
    );
};

export default ResizableContainer;
