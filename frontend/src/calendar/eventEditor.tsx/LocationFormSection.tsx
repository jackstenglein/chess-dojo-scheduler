import { Stack, TextField, Typography } from '@mui/material';

interface LocationFormSectionProps {
    location: string;
    setLocation: (value: string) => void;
    helperText?: string;
}

const LocationFormSection: React.FC<LocationFormSectionProps> = ({
    location,
    setLocation,
    helperText,
}) => {
    return (
        <Stack>
            <Typography variant='h6'>Location (Optional)</Typography>
            <Typography variant='subtitle1' color='text.secondary' sx={{ mb: 1.5 }}>
                Add a Zoom link, specify a Discord classroom, etc.
            </Typography>
            <TextField
                data-cy='location-textfield'
                fullWidth
                label='Location'
                variant='outlined'
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                helperText={helperText}
            />
        </Stack>
    );
};

export default LocationFormSection;
