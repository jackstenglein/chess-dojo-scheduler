import { Container } from '@mui/material';

import { useRouter } from '@/hooks/useRouter';
import UpsellDialog, { UpsellDialogProps } from './UpsellDialog';

interface UpsellPageProps extends Omit<UpsellDialogProps, 'open' | 'onClose'> {
    redirectTo: string;
}

const UpsellPage: React.FC<UpsellPageProps> = ({ redirectTo, ...props }) => {
    const router = useRouter();

    return (
        <Container maxWidth='lg' sx={{ pt: 5 }}>
            <UpsellDialog
                open={true}
                onClose={() => router.push(redirectTo)}
                {...props}
            />
        </Container>
    );
};

export default UpsellPage;
