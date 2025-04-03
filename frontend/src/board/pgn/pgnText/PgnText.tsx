import { UnpublishedGameBanner } from '@/components/games/edit/UnpublishedGameBanner';
import { UnsavedGameBanner } from '@/components/games/edit/UnsavedGameBanner';
import { AfterPgnText } from '@/components/material/memorizegames/AfterPgnText';
import useGame from '@/context/useGame';
import { useLightMode } from '@/style/useLightMode';
import { Card, Stack } from '@mui/material';
import React, { useMemo, useRef } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { useLocalStorage } from 'usehooks-ts';
import { PgnBoardMode, useChess } from '../PgnBoard';
import ResizeHandle from '../ResizeHandle';
import { HideEngine } from '../boardTools/underboard/settings/ViewerSettings';
import { ResizableData } from '../resize';
import GameComment from './GameComment';
import Result from './Result';
import Variation from './Variation';
import EngineSection from './engine/EngineSection';

const PgnText = () => {
    const light = useLightMode();
    const ref = useRef<HTMLDivElement>(null);
    const { mode, config, slots, slotProps } = useChess();
    const { unsaved, game, isOwner } = useGame();
    const [hideEngine] = useLocalStorage(HideEngine.Key, HideEngine.Default);

    const handleScroll = (child: HTMLElement | null) => {
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
        <Stack spacing={1} maxHeight={1}>
            {game && game.unlisted === true && isOwner && <UnpublishedGameBanner dismissable />}
            {unsaved && <UnsavedGameBanner dismissable />}

            <Card
                data-cy='pgn-text'
                variant={light ? 'outlined' : 'elevation'}
                sx={{ display: 'flex', flexDirection: 'column' }}
            >
                {!config?.disableEngine && !hideEngine && <EngineSection />}
                <Stack
                    ref={ref}
                    sx={{ overflowY: 'scroll', overflowX: 'clip', flexGrow: 1, width: 1 }}
                >
                    <GameComment />
                    <Variation handleScroll={handleScroll} />
                    {!slotProps?.pgnText?.hideResult && <Result />}

                    {slots?.afterPgnText ? (
                        slots.afterPgnText
                    ) : mode === PgnBoardMode.Solitaire ? (
                        <AfterPgnText />
                    ) : undefined}
                </Stack>
            </Card>
        </Stack>
    );
};

interface ResizablePgnTextProps {
    resizeData: ResizableData;
    onResize: (width: number, height: number) => void;
}

export const ResizablePgnText: React.FC<ResizablePgnTextProps> = (props) => {
    const { resizeData, onResize } = props;
    const { chess } = useChess();

    const handleResize = (_: React.SyntheticEvent, data: ResizeCallbackData) => {
        onResize(data.size.width, data.size.height);
    };

    const Pgn = useMemo(() => <PgnText />, []);

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
                    visibility: chess ? undefined : 'hidden',
                }}
            >
                {Pgn}
            </Stack>
        </Resizable>
    );
};

export default PgnText;
