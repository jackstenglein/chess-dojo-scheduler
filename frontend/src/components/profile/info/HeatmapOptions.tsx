import { useAuth } from '@/auth/Auth';
import { ZoomOutMap } from '@mui/icons-material';
import { IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';

/**
 * The field of the TimelineEntry displayed by the heatmap.
 */
export type TimelineEntryField = 'dojoPoints' | 'minutesSpent';

/**
 * The color mode of the heatmap.
 */
export type HeatmapColorMode = 'standard' | 'monochrome';

const heatmapField = {
    key: 'activityHeatmap.field',
    default: 'minutesSpent',
} as const;

const heatmapMaxPoints = {
    key: 'activityHeatmap.maxPoints',
    default: 1,
} as const;

const heatmapMaxMinutes = {
    key: 'activityHeatmap.maxMinutes',
    default: 60,
} as const;

const heatmapColorMode = {
    key: 'activityHeatmap.colorMode',
    default: 'standard',
} as const;

/**
 * @returns Current options and setters for the Heatmap.
 */
export function useHeatmapOptions() {
    const { user } = useAuth();
    const [field, setField] = useLocalStorage<TimelineEntryField>(
        heatmapField.key,
        heatmapField.default,
    );
    const [maxPoints, setMaxPoints] = useLocalStorage<number>(
        heatmapMaxPoints.key,
        heatmapMaxPoints.default,
    );
    const [maxMinutes, setMaxMinutes] = useLocalStorage<number>(
        heatmapMaxMinutes.key,
        heatmapMaxMinutes.default,
    );
    const [colorMode, setColorMode] = useLocalStorage<HeatmapColorMode>(
        heatmapColorMode.key,
        heatmapColorMode.default,
    );
    const [originalWeekStartOn] = useLocalStorage('calendarFilters.weekStartOn', 0);

    const weekStartOn = user?.weekStart ?? originalWeekStartOn;
    const weekEndOn = (weekStartOn + 6) % 7;

    return {
        field,
        setField,
        maxPoints,
        setMaxPoints,
        maxMinutes,
        setMaxMinutes,
        colorMode,
        setColorMode,
        weekStartOn,
        weekEndOn,
    };
}

/**
 * Renders options for the heatmap.
 */
export function HeatmapOptions({ onPopOut }: { onPopOut?: () => void }) {
    const { field, setField, maxPoints, setMaxPoints, maxMinutes, setMaxMinutes } =
        useHeatmapOptions();

    return (
        <Stack
            direction='row'
            mb={3}
            alignItems='center'
            flexWrap='wrap'
            justifyContent='space-between'
        >
            <Stack direction='row' gap={2} alignItems='center' flexWrap='wrap' flexGrow={1}>
                <TextField
                    label='Type'
                    size='small'
                    select
                    value={field}
                    onChange={(e) => setField(e.target.value as TimelineEntryField)}
                    sx={{ ml: -0.6 }}
                >
                    <MenuItem value='dojoPoints'>Dojo Points</MenuItem>
                    <MenuItem value='minutesSpent'>Hours Worked</MenuItem>
                </TextField>
                <TextField
                    label='Goal'
                    size='small'
                    select
                    value={field === 'dojoPoints' ? maxPoints : maxMinutes / 60}
                    onChange={(e) =>
                        field === 'dojoPoints'
                            ? setMaxPoints(Number(e.target.value))
                            : setMaxMinutes(Number(e.target.value) * 60)
                    }
                >
                    {[1, 2, 3, 4].map((value) => (
                        <MenuItem key={value} value={value}>
                            {value} {field === 'dojoPoints' ? 'point' : 'hour'}
                            {value !== 1 && 's'}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>

            {onPopOut && (
                <Tooltip title='Pop out view'>
                    <IconButton color='primary' onClick={onPopOut}>
                        <ZoomOutMap />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
    );
}
