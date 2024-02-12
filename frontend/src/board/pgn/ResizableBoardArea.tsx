import { Stack } from '@mui/material';
import { Move } from '@jackstenglein/chess';
import { ResizeCallbackData } from 'react-resizable';
import { Color } from 'chessground/types';

import PlayerHeader from './PlayerHeader';
import BoardButtons from './boardTools/boardButtons/BoardButtons';
import { useAuth } from '../../auth/Auth';
import Board, { BoardApi, Chess, PrimitiveMove } from '../Board';
import { Game } from '../../database/game';
import { ResizableData } from './resize';

interface ResizableBoardAreaProps {
    resizeData: ResizableData;
    onResize: (width: number, height: number) => void;
    hideResize?: boolean;
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
    resizeData,
    onResize,
    hideResize,
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

    const handlResize = (_: React.SyntheticEvent, data: ResizeCallbackData) => {
        onResize(data.size.width, data.size.height);
    };

    return (
        <Stack width={`${resizeData.width}px`}>
            {showPlayerHeaders && <PlayerHeader type='header' />}

            <Board
                config={{
                    pgn,
                    fen,
                    orientation: startOrientation,
                }}
                onInitialize={onInitialize}
                onMove={onMove}
                resizeData={resizeData}
                onResize={handlResize}
                hideResize={hideResize}
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
