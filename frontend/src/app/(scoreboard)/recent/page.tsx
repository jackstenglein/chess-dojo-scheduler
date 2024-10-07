import { Container } from '@mui/material';
import dynamic from 'next/dynamic';

const RecentGraduates = dynamic(() => import('./RecentGraduates'), { ssr: false });

export default function RecentPage() {
    return (
        <Container maxWidth='lg' sx={{ pt: 6, pb: 4 }}>
            <RecentGraduates />
        </Container>
    );
}
