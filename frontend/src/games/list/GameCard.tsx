import { GameInfo } from '@/database/game';
import { Stack, Typography } from '@mui/material';

export default function GameCard({ date, cohort }: GameInfo) {
    return (
        <Stack height={1} justifyContent='center' alignItems='center' textAlign='center'>
            <Typography variant='h5' mb={0.5}>
                Such good game {date}
            </Typography>
            <Typography variant='subtitle1' color='text.secondary' lineHeight='1.3'>
                Wow! {cohort}
            </Typography>
        </Stack>
    );
}
