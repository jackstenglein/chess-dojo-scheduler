import { Divider, Grid, Stack, Typography } from '@mui/material';

interface MoveNumberProps {
    ply: number;
}

const MoveNumber: React.FC<MoveNumberProps> = ({ ply }) => {
    let moveNumber = Math.floor(ply / 2);
    if (ply % 2) {
        moveNumber += 1;
    }

    return (
        <Grid key={'move-number-' + ply} item xs={2}>
            <Stack
                justifyContent='center'
                alignItems='center'
                sx={{ height: 1, position: 'relative' }}
            >
                <Typography color='text.secondary'>{moveNumber}</Typography>
                <Divider orientation='vertical' sx={{ position: 'absolute', right: 0 }} />
            </Stack>
        </Grid>
    );
};

export default MoveNumber;
