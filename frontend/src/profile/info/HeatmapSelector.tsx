import { Box, MenuItem, TextField, Tooltip } from '@mui/material';
import React, { SetStateAction } from 'react';

/**
 * Indicates the users work type either Dojopoints, minspent
 */
export type TimelineEntryField = 'dojoPoints' | 'minutesSpent';
/**
 * Indicates the view mode, either standard (colorful heatmap) or task which is just a single purple color
 */
export type View = 'standard' | 'task';

/**
 * the props for heatmap selector
 */

interface HeatmapSelectorProps {
    field: string; // heatmap work type field
    setField: (value: SetStateAction<TimelineEntryField>) => void; // setter field
    maxPointsCount: number; // max points count for heatmap
    setMaxPointsCount: (value: number) => void; // setter for max point count
    maxHoursCount: number; // max hour count
    setMaxHoursCount: (value: number) => void; // setter for max hours count
    view: string; // the view mode
    setView: (value: SetStateAction<View>) => void; // setter for view
}

/**
 * renders heatmap selector card
 * @param HeatmapSelectorProps
 * @returns heatmap selector card
 */
const HeatmapSelector: React.FC<HeatmapSelectorProps> = ({
    field,
    setField,
    maxPointsCount,
    setMaxPointsCount,
    maxHoursCount,
    setMaxHoursCount,
    view,
    setView,
}) => {
    return (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Tooltip title='Work type' placement='top'>
                <TextField
                    size='small'
                    select
                    value={field}
                    onChange={(e) => setField(e.target.value as TimelineEntryField)}
                    sx={{ ml: -0.6 }}
                >
                    <MenuItem value='dojoPoints'>Dojo Points</MenuItem>
                    <MenuItem value='minutesSpent'>Hours Worked</MenuItem>
                </TextField>
            </Tooltip>
            <Tooltip title='Goal levels per day' placement='top'>
                <TextField
                    size='small'
                    select
                    value={field === 'dojoPoints' ? maxPointsCount : maxHoursCount / 60}
                    onChange={(e) =>
                        field === 'dojoPoints'
                            ? setMaxPointsCount(Number(e.target.value))
                            : setMaxHoursCount(Number(e.target.value) * 60)
                    }
                >
                    {[1, 2, 3, 4].map((value) => (
                        <MenuItem key={value} value={value}>
                            {value}{' '}
                            {field === 'dojoPoints'
                                ? 'point'
                                : value === 1
                                  ? 'hour'
                                  : 'hours'}
                        </MenuItem>
                    ))}
                </TextField>
            </Tooltip>
            <Tooltip title='View mode' placement='top'>
                <TextField
                    size='small'
                    select
                    value={view}
                    onChange={(e) => setView(e.target.value as View)}
                >
                    <MenuItem value='standard'>Classic</MenuItem>
                    <MenuItem value='task'>Single</MenuItem>
                </TextField>
            </Tooltip>
        </Box>
    );
};

export default HeatmapSelector;
