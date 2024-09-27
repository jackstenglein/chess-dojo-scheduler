import { Grid2, Slider as MuiSlider, Typography } from '@mui/material';

interface Props {
    value: number;
    setValue: (value: number) => void;
    min: number;
    max: number;
    label: string;
    xs?: number;
    marksFilter?: number;
}

/**
 * Renders a MUI Slider with a label and marks at specified steps.
 * @param min The min value of the slider.
 * @param max The max value of the slider.
 * @param label The label displayed to the left of the slider.
 * @param value The current value of the slider.
 * @param setValue A callback invoked with the new value of the slider on changes.
 * @param xs The size of the grid container on xs breakpoint.
 * @param marksFilter The mod of the slider marks.
 */
export default function Slider({
    min,
    max,
    label,
    value,
    setValue,
    xs,
    marksFilter = 1,
}: Props) {
    return (
        <Grid2 container size={xs ?? 11} justifyContent='center' alignItems='center'>
            <Typography id={`input-${label}`} textAlign='left' width='100%'>
                {label}
            </Typography>

            <MuiSlider
                min={min}
                max={max}
                marks={Array.from({ length: max - min + 1 }, (_, i) => ({
                    value: i + min,
                    label: `${i + min}`,
                })).filter((_, i) => i % marksFilter === 0)}
                step={1}
                valueLabelDisplay='off'
                value={value}
                onChange={(_, value) => setValue(value as number)}
                aria-labelledby={`input-${label}`}
                color='success'
            />
        </Grid2>
    );
}
