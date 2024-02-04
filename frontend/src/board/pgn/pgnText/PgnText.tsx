import React, { useRef, useState } from 'react';
import { Move } from '@jackstenglein/chess';
import { Card, Stack } from '@mui/material';
import { Resizable, ResizeCallbackData } from 'react-resizable';

import Result from './Result';
import Variation from './Variation';
import GameComment from './GameComment';
import { useLightMode } from '../../../ThemeProvider';

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

export const ResizablePgnText: React.FC<PgnTextProps> = (props) => {
    const [size, setSize] = useState({ width: 400, height: 751 });

    const onResize = (_: React.SyntheticEvent, data: ResizeCallbackData) => {
        setSize({ width: data.size.width, height: data.size.height });
    };

    return (
        <Resizable width={size.width} height={size.height} onResize={onResize}>
            <Stack
                sx={{
                    overflowY: 'auto',
                    mb: { xs: 1, md: 0 },
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                }}
            >
                <PgnText {...props} />
            </Stack>
        </Resizable>
    );
};

export default PgnText;
