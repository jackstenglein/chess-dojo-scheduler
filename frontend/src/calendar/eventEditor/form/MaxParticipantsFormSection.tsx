import { Stack, TextField, Typography } from '@mui/material';
import Icon from '../../../style/Icon';

interface MaxParticipantsFormSectionProps {
    maxParticipants: string;
    setMaxParticipants: (value: string) => void;
    subtitle: string;
    helperText?: string;
    error?: string;
}

const MaxParticipantsFormSection: React.FC<MaxParticipantsFormSectionProps> = ({
    maxParticipants,
    setMaxParticipants,
    subtitle,
    helperText,
    error,
}) => {
    return (
        <Stack>
            <Typography variant='h6'>
                <Icon
                    name='player'
                    color='primary'
                    sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                    fontSize='medium'
                />
                Max Participants
            </Typography>
            <Typography variant='subtitle1' color='text.secondary' sx={{ mb: 1.5 }}>
                {subtitle}
            </Typography>
            <TextField
                data-cy='participants-textfield'
                fullWidth
                label='Max Participants'
                variant='outlined'
                value={maxParticipants}
                inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                }}
                onChange={(event) => setMaxParticipants(event.target.value)}
                helperText={error || helperText}
                error={Boolean(error)}
            />
        </Stack>
    );
};

export default MaxParticipantsFormSection;
