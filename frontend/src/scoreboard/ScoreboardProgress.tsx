import { Box, LinearProgress, LinearProgressProps, Typography } from '@mui/material';

function ScoreboardProgress(
    props: LinearProgressProps & { value: number; max: number; min: number }
) {
    const normalized = ((props.value - props.min) * 100) / (props.max - props.min);

    return (
        <Box sx={{ width: 1, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flexGrow: 1, mr: 1 }}>
                <LinearProgress variant='determinate' {...props} value={normalized} />
            </Box>
            <Box>
                <Typography
                    variant='body2'
                    color='text.secondary'
                >{`${props.value}/${props.max}`}</Typography>
            </Box>
        </Box>
    );
}

export default ScoreboardProgress;
