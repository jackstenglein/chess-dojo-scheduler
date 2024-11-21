import { Alert, Button } from '@mui/material';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';

interface UpsellAlertProps {
    children: string;
}

const UpsellAlert: React.FC<UpsellAlertProps> = ({ children }) => {
    const pathname = usePathname();

    return (
        <Alert
            data-cy='upsell-alert'
            severity='warning'
            variant='filled'
            action={
                <Button
                    component={NextLink}
                    color='inherit'
                    href={`/prices?redirect=${pathname}`}
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
