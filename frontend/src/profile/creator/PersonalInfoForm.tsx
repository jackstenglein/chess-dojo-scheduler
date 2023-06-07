import { useState } from 'react';
import { MenuItem, Stack, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { DefaultTimezone } from '../../calendar/CalendarFilters';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { ProfileCreatorFormProps } from './ProfileCreatorPage';

function getTimezoneOptions() {
    const options = [];
    for (let i = -12; i <= 14; i++) {
        const displayLabel = i < 0 ? `UTC${i}` : `UTC+${i}`;
        const value = i <= 0 ? `Etc/GMT+${Math.abs(i)}` : `Etc/GMT-${i}`;
        options.push(
            <MenuItem key={i} value={value}>
                {displayLabel}
            </MenuItem>
        );
    }
    return options;
}

const PersonalInfoForm: React.FC<ProfileCreatorFormProps> = ({ user, onNextStep }) => {
    const api = useApi();
    const request = useRequest();

    const [displayName, setDisplayName] = useState(user.displayName);
    const [bio, setBio] = useState(user.bio);
    const [timezone, setTimezone] = useState(
        user.timezoneOverride === DefaultTimezone ? '' : user.timezoneOverride
    );

    const canSave = displayName.trim().length > 0;

    const onSave = () => {
        if (!canSave) {
            return;
        }

        request.onStart();
        api.updateUser({
            displayName: displayName.trim(),
            bio,
            timezoneOverride: timezone === '' ? user.timezoneOverride : timezone,
        })
            .then(onNextStep)
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Stack spacing={4}>
            <TextField
                required
                label='Display Name'
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                helperText={'This is how other users will identify you'}
            />

            <TextField
                label='Bio (Optional)'
                multiline
                minRows={3}
                maxRows={6}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
            />

            <TextField
                select
                label='Timezone (Optional)'
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
            >
                {getTimezoneOptions()}
            </TextField>

            <LoadingButton
                disabled={!canSave}
                loading={request.isLoading()}
                variant='contained'
                onClick={onSave}
                sx={{ alignSelf: 'end' }}
            >
                Next
            </LoadingButton>

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default PersonalInfoForm;
