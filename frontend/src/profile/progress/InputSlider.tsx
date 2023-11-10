import { Grid, Slider, Input, Typography } from '@mui/material';

interface InputSliderProps {
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    max: number;
    min: number;
    suffix?: string;
}

const InputSlider: React.FC<InputSliderProps> = ({
    value,
    setValue,
    max,
    min,
    suffix,
}) => {
    const handleSliderChange = (event: Event, newValue: number | number[]) => {
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
            spacing={2}
            alignItems='center'
            justifyContent='space-between'
        >
            <Grid item xs={12} sm={9.5}>
                <Slider
                    value={typeof value === 'number' ? value : 0}
                    onChange={handleSliderChange}
                    aria-labelledby='input-slider'
                    step={1}
                    max={max}
                    min={min}
                />
            </Grid>
            <Grid item xs={12} sm={2} sx={{ position: 'relative' }}>
                {suffix && (
                    <Typography
                        sx={{
                            position: 'absolute',
                            left: { xs: '130px', sm: '45px', md: '90px' },
                            bottom: '4px',
                        }}
                    >
                        {suffix}
                    </Typography>
                )}
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
