import { Container, Stack, Typography } from '@mui/material';
import RecentGraduates from './graduates/RecentGraduates';

const HomePage = () => {
    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Stack spacing={5}>
                <RecentGraduates />
                <Typography variant='h6'>Featured Games</Typography>
                <Typography>Coming Soon</Typography>
            </Stack>
        </Container>
    );
};

export default HomePage;
