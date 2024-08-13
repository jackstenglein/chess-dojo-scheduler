import { Stack } from '@mui/material';
import { Color } from 'chessground/types';
import { ResizeCallbackData } from 'react-resizable';

import Board, { BoardApi, Chess } from '../Board';
import PlayerHeader from './PlayerHeader';
import BoardButtons from './boardTools/boardButtons/BoardButtons';
import { UnderboardApi } from './boardTools/underboard/Underboard';
import { ResizableData } from './resize';

interface ResizableBoardAreaProps {
    resizeData: ResizableData;
    onResize: (width: number, height: number) => void;
    hideResize?: boolean;
    pgn?: string;
    fen?: string;
    showPlayerHeaders?: boolean;
    startOrientation?: Color;
    onInitialize: (board: BoardApi, chess: Chess) => void;
    underboardRef: React.RefObject<UnderboardApi>;
}

const ResizableBoardArea: React.FC<ResizableBoardAreaProps> = ({
    resizeData,
    onResize,
    hideResize,
    showPlayerHeaders = true,
    pgn,
    fen,
    startOrientation = 'white',
    onInitialize,
    underboardRef,
}) => {
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
                resizeData={resizeData}
                onResize={handlResize}
                hideResize={hideResize}
            />

            {showPlayerHeaders && <PlayerHeader type='footer' />}

            <BoardButtons underboardRef={underboardRef} />
        </Stack>
    );
};

export default ResizableBoardArea;
