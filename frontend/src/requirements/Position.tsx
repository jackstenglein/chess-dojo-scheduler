import { Box, Stack, Typography } from '@mui/material';

interface PositionProps {
    url: string;
    title?: string;
}

const Position: React.FC<PositionProps> = ({ url, title }) => {
    return (
        <Stack sx={{ width: 1 }} alignItems='center'>
            {title && <Typography variant='h6'>{title}</Typography>}
            <Box
                sx={{
                    width: 1,
                    aspectRatio: '0.8',
                    maxWidth: '304px',
                }}
            >
                <iframe
                    src={url}
                    title={url}
                    style={{ width: '100%', height: '100%' }}
                    frameBorder={0}
                />
            </Box>
        </Stack>
    );
};

export default Position;
