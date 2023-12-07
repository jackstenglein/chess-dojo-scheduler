import { Stack, Typography, TextField } from '@mui/material';

interface DescriptionFormSectionProps {
    subtitle: string;
    description: string;
    setDescription: (value: string) => void;
}

const DescriptionFormSection: React.FC<DescriptionFormSectionProps> = ({
    subtitle,
    description,
    setDescription,
}) => {
    return (
        <Stack>
            <Typography variant='h6'>Description (Optional)</Typography>
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
            />
        </Stack>
    );
};

export default DescriptionFormSection;
