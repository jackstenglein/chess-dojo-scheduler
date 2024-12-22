import { useWindowSizeEffect } from '@/style/useWindowSizeEffect';
import { useCallback, useEffect, useState } from 'react';
import { Heatmap } from '../info/Heatmap';
import { getBlockSize, MIN_BLOCK_SIZE } from '../info/HeatmapCard';
import { SectionProps } from './section';

export function HeatmapSection({ review }: SectionProps) {
    const [blockSize, setBlockSize] = useState(MIN_BLOCK_SIZE);

    const resizeDialogBlocks = useCallback(() => {
        setBlockSize(getBlockSize());
    }, [setBlockSize]);

    useEffect(resizeDialogBlocks, [resizeDialogBlocks]);
    useWindowSizeEffect(resizeDialogBlocks);

    if (!review.timeline) {
        return null;
    }

    return <Heatmap entries={review.timeline} blockSize={blockSize} />;
}
