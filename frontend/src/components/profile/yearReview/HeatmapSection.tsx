import { useTimeline } from '@/profile/activity/useTimeline';
import { useWindowSizeEffect } from '@/style/useWindowSizeEffect';
import { useCallback, useEffect, useState } from 'react';
import { Heatmap } from '../info/Heatmap';
import { getBlockSize, MIN_BLOCK_SIZE } from '../info/HeatmapCard';
import { SectionProps } from './section';

const endDateByPeriod: Record<string, string> = {
    '2024': '2024-12-22',
    '2023': '2024-12-25',
};

export function HeatmapSection({ review }: SectionProps) {
    const [blockSize, setBlockSize] = useState(MIN_BLOCK_SIZE);

    console.log('useTime: ', review.username);
    const { entries } = useTimeline(review.username);
    console.log('Entries: ', entries);

    const resizeDialogBlocks = useCallback(() => {
        setBlockSize(getBlockSize());
    }, [setBlockSize]);

    useEffect(resizeDialogBlocks, [resizeDialogBlocks]);
    useWindowSizeEffect(resizeDialogBlocks);

    return (
        <Heatmap
            entries={entries}
            blockSize={blockSize}
            description={review.period}
            minDate={`${review.period}-01-01`}
            maxDate={endDateByPeriod[review.period]}
        />
    );
}
