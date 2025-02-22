import { formatTime } from '@/database/requirement';
import {
    Box,
    CircularProgress,
    CircularProgressProps,
    IconButton,
    Typography,
} from '@mui/material';

const progressProps = [
    {
        size: '3.5rem',
    },
    {
        size: '4.25rem',
        thickness: 3,
    },
    {
        size: '4.95rem',
        thickness: 2.3,
    },
];

export function CircularTimeProgress(
    props: CircularProgressProps & { value: number; max: number },
) {
    const { onClick, ...rest } = props;
    let value = (props.value / props.max) * 100;
    const clampedValue = Math.min(100, value);

    const color =
        clampedValue < 50 ? 'error' : clampedValue < 100 ? 'warning' : 'success';

    const rings: JSX.Element[] = [];

    for (let i = 0; i < progressProps.length && value > 0; i++, value -= 100) {
        rings.push(
            <CircularProgress
                {...rest}
                key={i}
                variant='determinate'
                {...progressProps[i]}
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
            />,
        );
    }

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

            {rings}

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
                    sx={{ color: 'text.secondary' }}
                >
                    {formatTime(props.value)}
                </Typography>
            </Box>
        </Box>
    );
}
