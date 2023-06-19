import { Container, Stack } from '@mui/material';
import FeaturedGames from './FeaturedGames';
import RecentGraduates from './RecentGraduates';

const RecentPage = () => {
    return (
        <Container maxWidth='lg' sx={{ pt: 6, pb: 4 }}>
            <Stack spacing={5}>
                <RecentGraduates />
                <FeaturedGames />
            </Stack>
        </Container>
    );
};

export default RecentPage;
