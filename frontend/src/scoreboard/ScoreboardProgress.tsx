import { Box, LinearProgress, LinearProgressProps, Typography } from '@mui/material';

function ScoreboardProgress(
    props: LinearProgressProps & {
        value: number;
        max: number;
        min: number;
        label?: string;
    }
) {
    const normalized = ((props.value - props.min) * 100) / (props.max - props.min);

    return (
        <Box sx={{ width: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1, mr: 1 }}>
                <LinearProgress variant='determinate' {...props} value={normalized} />
            </Box>
            <Box>
                <Typography variant='body2' color='text.secondary'>
                    {props.label ? props.label : `${props.value}/${props.max}`}
                </Typography>
            </Box>
        </Box>
    );
}

export default ScoreboardProgress;
