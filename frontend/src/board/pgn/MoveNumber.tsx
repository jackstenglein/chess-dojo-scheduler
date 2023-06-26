import { Divider, Stack, Typography } from '@mui/material';

interface MoveNumberProps {
    ply: number;
}

const MoveNumber: React.FC<MoveNumberProps> = ({ ply }) => {
    let moveNumber = Math.floor(ply / 2);
    if (ply % 2) {
        moveNumber += 1;
    }

    return (
        <Stack
            justifyContent='center'
            alignItems='center'
            sx={{ height: 1, position: 'relative' }}
        >
            <Typography color='text.secondary'>{moveNumber}</Typography>
            <Divider orientation='vertical' sx={{ position: 'absolute', right: 0 }} />
        </Stack>
    );
};

export default MoveNumber;
