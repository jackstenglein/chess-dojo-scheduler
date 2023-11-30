import { Cancel, CheckCircle } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';

interface SellingPointProps {
    description: string;
    included: boolean;
}

const SellingPoint: React.FC<SellingPointProps> = ({ description, included }) => {
    return (
        <Stack direction='row' spacing={1}>
            {included ? <CheckCircle color='success' /> : <Cancel color='error' />}
            <Typography>{description}</Typography>
        </Stack>
    );
};

export default SellingPoint;
