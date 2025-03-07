import { formatTime } from '@/database/requirement';
import {
    Box,
    CircularProgress,
    CircularProgressProps,
    IconButton,
    Typography,
} from '@mui/material';

export function CircularTimeProgress(
    props: CircularProgressProps & { value: number; max: number },
) {
    const { onClick, ...rest } = props;
    const value = (props.value / props.max) * 100;
    const clampedValue = Math.min(100, value);

    const color =
        clampedValue < 50 ? 'error' : clampedValue < 100 ? 'warning' : 'success';

    const time = formatTime(props.value);
    return (
        <Box
            component={props.onClick ? IconButton : 'div'}
            sx={{
                position: 'relative',
                display: 'grid',
                alignItems: 'center',
                justifyItems: 'center',
            }}
            onClick={props.onClick}
        >
            <CircularProgress
                {...rest}
                variant='determinate'
                value={100}
                sx={{
                    color: `var(--mui-palette-LinearProgress-${color}Bg)`,
                    gridRow: 1,
                    gridColumn: 1,
                    zIndex: 1,
                }}
                size='3.5rem'
            />

            <CircularProgress
                {...rest}
                variant='determinate'
                size='3.5rem'
                value={Math.min(100, value)}
                color={color}
                sx={{
                    gridRow: 1,
                    gridColumn: 1,
                    zIndex: 2,
                    '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                    },
                }}
            />

            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant='caption'
                    component='div'
                    sx={{
                        color: 'text.secondary',
                        fontSize: time.length === 7 ? '0.65rem' : undefined,
                    }}
                >
                    {time}
                </Typography>
            </Box>
        </Box>
    );
}
