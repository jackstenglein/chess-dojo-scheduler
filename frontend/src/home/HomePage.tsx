import { Container, Stack } from '@mui/material';
import FeaturedGames from './FeaturedGames';
import RecentGraduates from './RecentGraduates';

const HomePage = () => {
    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Stack spacing={5}>
                <RecentGraduates />
                <FeaturedGames />
            </Stack>
        </Container>
    );
};

export default HomePage;
