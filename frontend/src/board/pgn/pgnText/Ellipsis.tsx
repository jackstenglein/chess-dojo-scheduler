import { Grid, Typography } from '@mui/material';

const Ellipsis: React.FC<{ ply: number }> = ({ ply }) => {
    return (
        <Grid key={`ellipsis-${ply}`} item xs={5}>
            <Typography color='text.secondary' pl={1}>
                ...
            </Typography>
        </Grid>
    );
};

export default Ellipsis;
