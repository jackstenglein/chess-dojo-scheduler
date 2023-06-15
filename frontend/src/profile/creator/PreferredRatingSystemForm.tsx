import { useState } from 'react';
import {
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

import { ProfileCreatorFormProps } from './ProfileCreatorPage';
import {
    RatingSystem,
    User,
    formatRatingSystem,
    getRatingUsername,
    hideRatingUsername,
} from '../../database/user';
import { LoadingButton } from '@mui/lab';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';

export function getUsernameLabel(rs: RatingSystem): string {
    switch (rs) {
        case RatingSystem.Chesscom:
            return 'Chess.com Username';
        case RatingSystem.Lichess:
            return 'Lichess Username';
        case RatingSystem.Fide:
            return 'FIDE ID';
        case RatingSystem.Uscf:
            return 'USCF ID';
        case RatingSystem.Ecf:
            return 'ECF Rating Code';
        case RatingSystem.Cfc:
            return 'CFC ID';
        case RatingSystem.Dwz:
            return 'DWZ ID';
        case RatingSystem.Custom:
            return '';
    }
}

export function getHelperText(rs: RatingSystem): string | undefined {
    switch (rs) {
        case RatingSystem.Chesscom:
        case RatingSystem.Lichess:
        case RatingSystem.Fide:
        case RatingSystem.Uscf:
        case RatingSystem.Cfc:
        case RatingSystem.Dwz:
        case RatingSystem.Custom:
            return undefined;

        case RatingSystem.Ecf:
            return 'Enter your ECF rating code, not your membership number';
    }
}

export function getUsernameType(rs: RatingSystem): string {
    switch (rs) {
        case RatingSystem.Chesscom:
        case RatingSystem.Lichess:
            return 'username';

        case RatingSystem.Fide:
        case RatingSystem.Uscf:
        case RatingSystem.Cfc:
        case RatingSystem.Dwz:
            return 'ID';

        case RatingSystem.Ecf:
            return 'rating code';

        case RatingSystem.Custom:
            return '';
    }
}

function getUpdate(
    rs: RatingSystem,
    username: string,
    hideUsername: boolean
): Partial<User> {
    const result: Partial<User> = { ratingSystem: rs };

    switch (rs) {
        case RatingSystem.Chesscom:
            result.chesscomUsername = username;
            result.hideChesscomUsername = hideUsername;
            break;
        case RatingSystem.Lichess:
            result.lichessUsername = username;
            result.hideLichessUsername = hideUsername;
            break;
        case RatingSystem.Fide:
            result.fideId = username;
            result.hideFideId = hideUsername;
            break;
        case RatingSystem.Uscf:
            result.uscfId = username;
            result.hideUscfId = hideUsername;
            break;
        case RatingSystem.Ecf:
            result.ecfId = username;
            result.hideEcfId = hideUsername;
            break;
        case RatingSystem.Cfc:
            result.cfcId = username;
            result.hideCfcId = hideUsername;
            break;
        case RatingSystem.Dwz:
            result.dwzId = username;
            result.hideDwzId = hideUsername;
            break;
    }

    return result;
}

const { Custom, ...RatingSystems } = RatingSystem;

const PreferredRatingSystemForm: React.FC<ProfileCreatorFormProps> = ({
    user,
    onNextStep,
    onPrevStep,
}) => {
    const api = useApi();
    const request = useRequest();

    const [ratingSystem, setRatingSystem] = useState(user.ratingSystem);
    const [username, setUsername] = useState(getRatingUsername(user, ratingSystem) || '');
    const [hideUsername, setHideUsername] = useState(
        hideRatingUsername(user, ratingSystem)
    );

    const canSave = (ratingSystem as string) !== '' && username !== '';

    const onSave = () => {
        request.onStart();
        api.updateUser(getUpdate(ratingSystem, username, hideUsername), true)
            .then(onNextStep)
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Stack spacing={4}>
            <Typography>
                Enter your preferred rating system, and we will place you in a cohort
                based on your rating. You should choose the rating system that best
                reflects your strength (IE: the one you play most often). You can always
                change your cohort later if the program is too hard or too easy.
            </Typography>

            <TextField
                required
                select
                label='Preferred Rating System'
                value={ratingSystem}
                onChange={(event) => setRatingSystem(event.target.value as RatingSystem)}
                helperText='Choose the rating system you play most often'
            >
                {Object.values(RatingSystems).map((option) => (
                    <MenuItem key={option} value={option}>
                        {formatRatingSystem(option)}
                    </MenuItem>
                ))}
            </TextField>

            {(ratingSystem as string) !== '' && (
                <Stack spacing={3}>
                    <TextField
                        required
                        label={getUsernameLabel(ratingSystem)}
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        helperText={getHelperText(ratingSystem)}
                    />

                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={hideUsername}
                                onChange={(event) =>
                                    setHideUsername(event.target.checked)
                                }
                            />
                        }
                        label={`Hide my ${getUsernameType(
                            ratingSystem
                        )} from other dojo members`}
                    />
                </Stack>
            )}

            <Stack direction='row' justifyContent='space-between'>
                <Button
                    disabled={request.isLoading()}
                    onClick={onPrevStep}
                    variant='contained'
                >
                    Back
                </Button>

                <LoadingButton
                    loading={request.isLoading()}
                    variant='contained'
                    onClick={onSave}
                    disabled={!canSave}
                    sx={{ alignSelf: 'end' }}
                >
                    Next
                </LoadingButton>
            </Stack>

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default PreferredRatingSystemForm;
