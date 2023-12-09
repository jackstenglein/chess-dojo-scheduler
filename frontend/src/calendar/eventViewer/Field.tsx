import { Stack, Typography } from '@mui/material';

interface FieldProps {
    title: string;
    body: string;
}

const Field: React.FC<FieldProps> = ({ title, body }) => {
    if (!title || !body) {
        return null;
    }

    return (
        <Stack>
            <Typography variant='subtitle2' color='text.secondary'>
                {title}
            </Typography>
            <Typography variant='body1'>{body}</Typography>
        </Stack>
    );
};

export default Field;
