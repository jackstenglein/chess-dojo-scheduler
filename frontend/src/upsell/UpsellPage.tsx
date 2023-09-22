import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import UpsellDialog, { UpsellDialogProps } from './UpsellDialog';

interface UpsellPageProps extends Omit<UpsellDialogProps, 'open' | 'onClose'> {
    redirectTo: string;
}

const UpsellPage: React.FC<UpsellPageProps> = ({ redirectTo, ...props }) => {
    const navigate = useNavigate();

    return (
        <Container maxWidth='lg' sx={{ pt: 5 }}>
            <UpsellDialog open={true} onClose={() => navigate(redirectTo)} {...props} />
        </Container>
    );
};

export default UpsellPage;
