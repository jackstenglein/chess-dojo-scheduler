import { Stack, TextField, Typography } from '@mui/material';
import Icon from '../../../style/Icon';
interface LocationFormSectionProps {
    subtitle: string;
    location: string;
    setLocation: (value: string) => void;
    helperText?: string;
    required?: boolean;
    error?: string;
}

const LocationFormSection: React.FC<LocationFormSectionProps> = ({
    subtitle,
    location,
    setLocation,
    helperText,
    required,
    error,
}) => {
    return (
        <Stack>
            <Typography variant='h6'>
                <Icon
                    name='location'
                    color='primary'
                    sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                    fontSize='medium'
                />
                Location {!required && '(Optional)'}
            </Typography>
            <Typography variant='subtitle1' color='text.secondary' sx={{ mb: 1.5 }}>
                {subtitle}
            </Typography>
            <TextField
                data-cy='location-textfield'
                fullWidth
                label='Location'
                variant='outlined'
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                helperText={error || helperText}
                error={Boolean(error)}
            />
        </Stack>
    );
};

export default LocationFormSection;
