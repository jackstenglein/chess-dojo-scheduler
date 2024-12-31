import Icon from '@/style/Icon';
import { Stack, TextField, Typography } from '@mui/material';

interface DescriptionFormSectionProps {
    subtitle: string;
    description: string;
    setDescription: (value: string) => void;
    required?: boolean;
    error?: string;
}

const DescriptionFormSection: React.FC<DescriptionFormSectionProps> = ({
    subtitle,
    description,
    setDescription,
    required,
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
                Description {!required && '(Optional)'}
            </Typography>
            <Typography variant='subtitle1' color='text.secondary' sx={{ mb: 1.5 }}>
                {subtitle}
            </Typography>
            <TextField
                data-cy='description-textfield'
                label='Description'
                multiline
                minRows={3}
                maxRows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                error={Boolean(error)}
                helperText={error}
            />
        </Stack>
    );
};

export default DescriptionFormSection;
