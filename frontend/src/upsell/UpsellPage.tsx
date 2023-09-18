import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import UpsellDialog from './UpsellDialog';

interface UpsellPageProps {
    redirectTo: string;
}

const UpsellPage: React.FC<UpsellPageProps> = ({ redirectTo }) => {
    const navigate = useNavigate();

    return (
        <Container maxWidth='lg' sx={{ pt: 5 }}>
            <UpsellDialog open={true} onClose={() => navigate(redirectTo)} />
        </Container>
    );
};

export default UpsellPage;
