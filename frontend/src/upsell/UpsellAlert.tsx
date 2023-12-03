import { Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface UpsellAlertProps {
    children: string;
}

const UpsellAlert: React.FC<UpsellAlertProps> = ({ children }) => {
    const navigate = useNavigate();

    const onViewPrices = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const currentPage = encodeURIComponent(window.location.href);
        navigate(`/prices?redirect=${currentPage}`);
    };

    return (
        <Alert
            data-cy='upsell-alert'
            severity='warning'
            variant='filled'
            action={
                <Button
                    color='inherit'
                    href='/prices'
                    size='small'
                    onClick={onViewPrices}
                >
                    View Prices
                </Button>
            }
        >
            {children}
        </Alert>
    );
};

export default UpsellAlert;
