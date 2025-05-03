import { FormControl, Grid, InputLabel, OutlinedInput, Slider } from '@mui/material';

interface InputSliderProps {
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    max: number;
    min: number;
    suffix?: string;
}

const InputSlider: React.FC<InputSliderProps> = ({ value, setValue, max, min, suffix }) => {
    const handleSliderChange = (_: Event, newValue: number | number[]) => {
        setValue(newValue as number);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.target.value === '' ? 0 : parseInt(event.target.value);
        if (isNaN(value)) {
            value = 0;
        }
        setValue(value);
    };

    const handleBlur = () => {
        if (value < min) {
            setValue(min);
        }
    };

    return (
        <Grid
            container
            width={1}
            columnGap={4}
            rowGap={2}
            alignItems='center'
            justifyContent='space-between'
            pt={1}
        >
            <Grid
                size={{
                    xs: 12,
                    sm: 'grow',
                }}
            >
                <Slider
                    value={typeof value === 'number' ? value : 0}
                    onChange={handleSliderChange}
                    aria-labelledby='input-slider'
                    step={1}
                    max={max}
                    min={min}
                />
            </Grid>
            <Grid
                size={{
                    xs: 12,
                    sm: 3,
                    md: 2,
                }}
            >
                <FormControl sx={{ width: 1 }}>
                    {suffix && <InputLabel htmlFor='input-slider'>{suffix}</InputLabel>}
                    <OutlinedInput
                        id='input-slider'
                        data-cy='task-updater-count'
                        value={value}
                        size='small'
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        inputProps={{
                            step: 1,
                            min: min,
                            max: max,
                            type: 'number',
                            'aria-labelledby': 'input-slider',
                            style: { width: '100%' },
                        }}
                        label={suffix}
                        sx={{ width: 1 }}
                    />
                </FormControl>
            </Grid>
        </Grid>
    );
};

export default InputSlider;
