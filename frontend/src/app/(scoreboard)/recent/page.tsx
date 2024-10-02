import { Container } from '@mui/material';
import RecentGraduates from './RecentGraduates';

const RecentPage = () => {
    return (
        <Container maxWidth='lg' sx={{ pt: 6, pb: 4 }}>
            <RecentGraduates />
        </Container>
    );
};

export default RecentPage;
