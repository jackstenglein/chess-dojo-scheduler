import { Stack } from '@mui/material';
import { Move } from '@jackstenglein/chess';
import { ResizeCallbackData } from 'react-resizable';
import { Color } from 'chessground/types';

import PlayerHeader from './PlayerHeader';
import BoardButtons from './boardTools/boardButtons/BoardButtons';
import { useAuth } from '../../auth/Auth';
import Board, { BoardApi, Chess, PrimitiveMove } from '../Board';
import { Game } from '../../database/game';

interface ResizableBoardAreaProps {
    width: number;
    onResize: (width: number, height: number) => void;
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
    width,
    onResize,
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
        <Stack width={`${width}px`}>
            {showPlayerHeaders && <PlayerHeader type='header' />}

            <Board
                config={{
                    pgn,
                    fen,
                    orientation: startOrientation,
                }}
                onInitialize={onInitialize}
                onMove={onMove}
                size={width}
                onResize={handlResize}
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
