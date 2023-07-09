import { Box, Typography } from '@mui/material';

const Ellipsis: React.FC<{ ply: number }> = ({ ply }) => {
    return (
        <Box sx={{ flexBasis: `${500 / 12}%`, maxWidth: `${500 / 12}%` }}>
            <Typography color='text.secondary' pl={1}>
                ...
            </Typography>
        </Box>
    );
};

export default Ellipsis;
