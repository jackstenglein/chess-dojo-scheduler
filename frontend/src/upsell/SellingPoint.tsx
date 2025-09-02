import { Cancel, CheckCircle } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';

export enum SellingPointStatus {
    Included = 'INCLUDED',
    Restricted = 'RESTRICTED',
    Excluded = 'EXCLUDED',
}

interface SellingPointProps {
    description: string;
    status: SellingPointStatus;
}

const SellingPoint: React.FC<SellingPointProps> = ({ description, status }) => {
    let Icon;
    switch (status) {
        case SellingPointStatus.Included:
            Icon = <CheckCircle color='success' />;
            break;

        case SellingPointStatus.Restricted:
            Icon = <CheckCircle color='warning' />;
            break;

        case SellingPointStatus.Excluded:
            Icon = <Cancel color='error' />;
            break;
    }

    return (
        <Stack direction='row' spacing={1}>
            {Icon}
            <Typography>{description}</Typography>
        </Stack>
    );
};

export default SellingPoint;
