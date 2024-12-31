import Icon from '@/style/Icon';
import { Stack, TextField, Typography } from '@mui/material';

interface TitleFormSectionProps {
    title: string;
    subtitle?: string;
    setTitle: (value: string) => void;
    error?: string;
}

const TitleFormSection: React.FC<TitleFormSectionProps> = ({
    title,
    subtitle,
    setTitle,
    error,
}) => {
    return (
        <Stack>
            <Typography variant='h6'>
                <Icon
                    name='write'
                    color='primary'
                    sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                    fontSize='medium'
                />
                Event Title
            </Typography>
            {subtitle && (
                <Typography variant='subtitle1' color='text.secondary'>
                    {subtitle}
                </Typography>
            )}
            <TextField
                fullWidth
                label='Title'
                variant='outlined'
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={Boolean(error)}
                helperText={error}
                sx={{ mt: 2 }}
            />
        </Stack>
    );
};

export default TitleFormSection;
