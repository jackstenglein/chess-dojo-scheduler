import { formatTime } from '@/database/requirement';
import { alpha, Box, BoxProps, Chip, ChipProps } from '@mui/material';
import { RefObject } from 'react';

interface TimeProgressChipProps {
    /** The total goal in minutes. */
    goal: number;
    /** The current value completed in minutes. */
    value: number;
    /** Props passed to slots. */
    slotProps?: {
        /** Props passed to the main container. */
        container?: BoxProps;
        /** Props passed to the background. */
        background?: BoxProps;
        /** Props passed to the chip. */
        chip?: ChipProps;
    };
    /** The ref for the container. */
    ref?: RefObject<HTMLDivElement>;
}

/**
 * Renders a MUI chip with a progress bar in the background for the given goal
 * of time and current value.
 * @param goal The time goal for the chip.
 * @param value The current time completed for the chip.
 */
export function TimeProgressChip({ goal, value, slotProps, ref, ...rest }: TimeProgressChipProps) {
    const percentage = Math.min(100, goal > 0 ? (100 * value) / goal : 100);
    const color = percentage < 50 ? 'error' : percentage < 100 ? 'warning' : 'success';

    return (
        <Box
            ref={ref}
            sx={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}
            {...rest}
            {...slotProps?.container}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 1,
                    bottom: 1,
                    width: `${percentage}%`,
                    backgroundColor: (theme) => alpha(theme.palette[color].main, 0.2),
                }}
                {...slotProps?.background}
            />
            <Chip
                variant='outlined'
                label={`${formatTime(value)} / ${formatTime(goal)}`}
                {...slotProps?.chip}
                sx={{
                    borderColor: (theme) => alpha(theme.palette[color].main, 0.6),
                    ...slotProps?.chip?.sx,
                }}
            />
        </Box>
    );
}
