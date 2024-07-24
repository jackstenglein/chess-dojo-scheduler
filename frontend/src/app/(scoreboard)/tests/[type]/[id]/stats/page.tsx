import { Box, Container } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { RequestSnackbar } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import LoadingPage from '../../loading/LoadingPage';
import ExamStatistics from './ExamStatistics';
import { useExam } from './exam';

export const AdminStatsPage = () => {
    const user = useAuth().user;
    const { request, exam } = useExam();

    if (!user?.isAdmin) {
        return <Navigate to='/tests' />;
    }

    if (request.isFailure()) {
        return (
            <Container sx={{ py: 5 }}>
                <RequestSnackbar request={request} />
            </Container>
        );
    }

    if (!request.isSent() || request.isLoading() || !exam) {
        return <LoadingPage />;
    }

    return (
        <Box height='calc(100vh - var(--navbar-height))'>
            <ExamStatistics exam={exam} />
        </Box>
    );
};
