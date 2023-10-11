import { Button, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

interface CaughtUpMessageProps {
    since: string;
    onViewOlder?: () => void;
}

const CaughtUpMessage: React.FC<CaughtUpMessageProps> = ({ since, onViewOlder }) => {
    const date = new Date(since);

    return (
        <Stack alignItems='center' spacing={1}>
            <CheckCircleOutlineIcon color='success' fontSize='large' />

            <Stack alignItems='center'>
                <Typography fontWeight='bold'>You're all caught up</Typography>
                <Typography color='text.secondary'>
                    You've seen all new posts since {date.toLocaleDateString()}
                </Typography>

                {onViewOlder && (
                    <Button onClick={onViewOlder} sx={{ textTransform: 'none' }}>
                        View older posts
                    </Button>
                )}
            </Stack>
        </Stack>
    );
};

export default CaughtUpMessage;
