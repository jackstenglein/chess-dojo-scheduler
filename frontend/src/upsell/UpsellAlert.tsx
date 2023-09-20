import { Alert, Button } from '@mui/material';

interface UpsellAlertProps {
    children: string;
}

const UpsellAlert: React.FC<UpsellAlertProps> = ({ children }) => {
    return (
        <Alert
            data-cy='upsell-alert'
            severity='warning'
            variant='filled'
            action={
                <Button
                    color='inherit'
                    href='https://www.chessdojo.club/plans-pricing'
                    target='_blank'
                    rel='noreferrer'
                    size='small'
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
