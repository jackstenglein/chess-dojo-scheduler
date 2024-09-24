import { Alert, Button } from '@mui/material';

interface UpsellAlertProps {
    children: string;
}

const UpsellAlert: React.FC<UpsellAlertProps> = ({ children }) => {
    const currentPage = encodeURIComponent(window.location.href);

    return (
        <Alert
            data-cy='upsell-alert'
            severity='warning'
            variant='filled'
            action={
                <Button
                    color='inherit'
                    href={`/prices?redirect=${currentPage}`}
                    size='small'
                    sx={{ textAlign: 'center' }}
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
