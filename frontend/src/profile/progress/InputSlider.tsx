import { Grid, Slider, Input } from '@mui/material';

interface InputSliderProps {
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    max: number;
    min: number;
}

const InputSlider: React.FC<InputSliderProps> = ({ value, setValue, max, min }) => {
    const handleSliderChange = (event: Event, newValue: number | number[]) => {
        setValue(newValue as number);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value === '' ? 0 : Number(event.target.value));
    };

    const handleBlur = () => {
        if (value < min) {
            setValue(min);
        } else if (value > max) {
            setValue(max);
        }
    };

    return (
        <Grid
            container
            width={1}
            spacing={2}
            alignItems='center'
            justifyContent='space-between'
        >
            <Grid item xs={9.5}>
                <Slider
                    value={typeof value === 'number' ? value : 0}
                    onChange={handleSliderChange}
                    aria-labelledby='input-slider'
                    step={1}
                    max={max}
                    min={min}
                />
            </Grid>
            <Grid item xs={2}>
                <Input
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
                    }}
                    sx={{ minWidth: '60px' }}
                />
            </Grid>
        </Grid>
    );
};

export default InputSlider;
