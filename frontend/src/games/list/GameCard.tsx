import { GameInfo } from '@/database/game';
import { Stack, Typography } from '@mui/material';

interface GameCardProps {
    id: string;
    data: GameInfo;
}

export default function GameCard({ data }: GameCardProps) {
    return (
        <Stack height={1} justifyContent='center' alignItems='center' textAlign='center'>
            <Typography variant='h5' mb={0.5}>
                Such good game {data.date}
            </Typography>
            <Typography variant='subtitle1' color='text.secondary' lineHeight='1.3'>
                Wow! {data.cohort}
            </Typography>
        </Stack>
    );
}
