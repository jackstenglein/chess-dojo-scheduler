import React, { useMemo, useRef } from 'react';
import { Move } from '@jackstenglein/chess';
import { Card, Stack } from '@mui/material';
import { Resizable, ResizeCallbackData } from 'react-resizable';

import Result from './Result';
import Variation from './Variation';
import GameComment from './GameComment';
import { useLightMode } from '../../../ThemeProvider';
import { ResizableData } from '../resize';
import ResizeHandle from '../ResizeHandle';

interface PgnTextProps {
    onClickMove: (m: Move) => void;
}

const PgnText: React.FC<PgnTextProps> = ({ onClickMove }) => {
    const light = useLightMode();
    const ref = useRef<HTMLDivElement>(null);

    const handleScroll = (child: HTMLButtonElement | null) => {
        const scrollParent = ref.current;
        if (child && scrollParent) {
            const parentRect = scrollParent.getBoundingClientRect();
            const childRect = child.getBoundingClientRect();

            scrollParent.scrollTop =
                childRect.top -
                parentRect.top +
                scrollParent.scrollTop -
                scrollParent.clientHeight / 2;
        }
    };

    return (
        <Card
            data-cy='pgn-text'
            ref={ref}
            variant={light ? 'outlined' : 'elevation'}
            sx={{ overflowY: 'scroll' }}
        >
            <GameComment />
            <Variation handleScroll={handleScroll} onClickMove={onClickMove} />
            <Result />
        </Card>
    );
};

interface ResizablePgnTextProps extends PgnTextProps {
    resizeData: ResizableData;
    onResize: (width: number, height: number) => void;
}

export const ResizablePgnText: React.FC<ResizablePgnTextProps> = (props) => {
    const { resizeData, onResize, onClickMove } = props;

    const handleResize = (_: React.SyntheticEvent, data: ResizeCallbackData) => {
        onResize(data.size.width, data.size.height);
    };

    const Pgn = useMemo(() => <PgnText onClickMove={onClickMove} />, [onClickMove]);

    return (
        <Resizable
            width={resizeData.width}
            height={resizeData.height}
            minConstraints={[resizeData.minWidth, resizeData.minHeight]}
            maxConstraints={[resizeData.maxWidth, resizeData.maxHeight]}
            onResize={handleResize}
            handle={<ResizeHandle />}
        >
            <Stack
                sx={{
                    mb: { xs: 1, md: 0 },
                    width: `${resizeData.width}px`,
                    maxHeight: `${resizeData.height}px`,
                }}
            >
                {Pgn}
            </Stack>
        </Resizable>
    );
};

export default PgnText;
