import { Stack, Typography } from '@mui/material';

interface FieldProps {
    title?: string;
    body?: string;
    showEmptyBody?: boolean;
}

const Field: React.FC<FieldProps> = ({ title, body, showEmptyBody }) => {
    if (!title || (!showEmptyBody && !body)) {
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
