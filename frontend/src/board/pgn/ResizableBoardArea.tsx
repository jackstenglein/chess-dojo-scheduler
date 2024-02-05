import { Stack } from '@mui/material';
import { useCallback, useState } from 'react';
import { Move } from '@jackstenglein/chess';
import { ResizeCallbackData } from 'react-resizable';
import { Color } from 'chessground/types';

import PlayerHeader from './PlayerHeader';
import BoardButtons from './boardTools/boardButtons/BoardButtons';
import { useAuth } from '../../auth/Auth';
import Board, { BoardApi, Chess, PrimitiveMove } from '../Board';
import { Game } from '../../database/game';
import {
    getBoardPercentages,
    getBoardPixels,
    getDefaultPercentages,
    getDefaultWidth,
} from './resize';
import { useBreakpoint, useWindowSizeEffect } from '../../ThemeProvider';

interface ResizableBoardAreaProps {
    pgn?: string;
    fen?: string;
    showPlayerHeaders?: boolean;
    startOrientation?: Color;
    game?: Game;
    showEditor?: boolean;
    onInitialize: (board: BoardApi, chess: Chess) => void;
    onMove: (board: BoardApi, chess: Chess, primMove: PrimitiveMove) => void;
    onClickMove: (move: Move | null) => void;
}

const ResizableBoardArea: React.FC<ResizableBoardAreaProps> = ({
    showPlayerHeaders = true,
    pgn,
    fen,
    startOrientation = 'white',
    game,
    showEditor,
    onInitialize,
    onMove,
    onClickMove,
}) => {
    const user = useAuth().user;
    const [boardPercentages, setBoardPercentage] = useState(
        getDefaultPercentages('board')
    );
    const [boardSize, setBoardSize] = useState(getBoardPixels(boardPercentages));

    // console.log('Board size: ', boardSize);

    const onWindowResize = useCallback(() => {
        const newBoardSize = getBoardPixels(boardPercentages);
        console.log('New Board Size: ', newBoardSize);
        setBoardSize(newBoardSize);
    }, [setBoardSize, boardPercentages]);

    useWindowSizeEffect(onWindowResize);

    const onResize = (_: React.SyntheticEvent, data: ResizeCallbackData) => {
        console.log('onResize called');
        setBoardPercentage(getBoardPercentages(data.size.width));
        setBoardSize(data.size.width);
    };

    return (
        <Stack width={`${boardSize}px`}>
            {showPlayerHeaders && <PlayerHeader type='header' />}

            <Board
                config={{
                    pgn,
                    fen,
                    orientation: startOrientation,
                }}
                onInitialize={onInitialize}
                onMove={onMove}
                size={boardSize}
                onResize={onResize}
                minSize={300}
            />

            {showPlayerHeaders && <PlayerHeader type='footer' />}

            <BoardButtons
                onClickMove={onClickMove}
                game={game}
                showSave={showEditor && game?.owner === user?.username}
            />
        </Stack>
    );
};

export default ResizableBoardArea;
