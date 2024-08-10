import { useWindowSizeEffect } from '@/style/useWindowSizeEffect';
import { Stack } from '@mui/material';
import { Color } from 'chessground/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'react-resizable/css/styles.css';
import { BoardApi, Chess } from '../Board';
import KeyboardHandler from './KeyboardHandler';
import ResizableBoardArea from './ResizableBoardArea';
import Underboard, {
    UnderboardApi,
    UnderboardTab,
} from './boardTools/underboard/Underboard';
import { ResizablePgnText } from './pgnText/PgnText';
import { getNewSizes, getSizes } from './resize';

export const CONTAINER_ID = 'resize-container';

interface ResizableContainerProps {
    underboardTabs: UnderboardTab[];
    initialUnderboardTab?: string;

    pgn?: string;
    fen?: string;
    showPlayerHeaders?: boolean;
    startOrientation?: Color;
    onInitialize: (board: BoardApi, chess: Chess) => void;
}

const ResizableContainer: React.FC<ResizableContainerProps> = ({
    underboardTabs,
    initialUnderboardTab,
    showPlayerHeaders,
    pgn,
    fen,
    startOrientation,
    onInitialize,
}) => {
    const underboardRef = useRef<UnderboardApi>(null);
    const showUnderboard = underboardTabs.length > 0;

    const parentWidth =
        document.getElementById(CONTAINER_ID)?.getBoundingClientRect().width || 0;
    const [sizes, setSizes] = useState(
        getSizes(parentWidth, showUnderboard, !showPlayerHeaders),
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
                    !showPlayerHeaders,
                ),
            );
        },
        [setSizes, showPlayerHeaders],
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
            <KeyboardHandler underboardRef={underboardRef} />

            {showUnderboard && (
                <Underboard
                    ref={underboardRef}
                    tabs={underboardTabs}
                    initialTab={initialUnderboardTab}
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
                    onInitialize,
                    underboardRef,
                }}
            />

            <ResizablePgnText resizeData={sizes.pgn} onResize={onResize('pgn')} />
        </Stack>
    );
};

export default ResizableContainer;
