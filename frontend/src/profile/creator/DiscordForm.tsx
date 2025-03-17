import { LoadingButton } from '@mui/lab';
import {
    Button,
    Checkbox,
    FormControlLabel,
    Link,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useFreeTier } from '../../auth/Auth';
import { User } from '../../database/user';
import UpsellDialog, { RestrictedAction } from '../../upsell/UpsellDialog';
import { ProfileCreatorFormProps } from './ProfileCreatorPage';

const DiscordForm: React.FC<ProfileCreatorFormProps> = ({ user, onNextStep, onPrevStep }) => {
    const api = useApi();
    const request = useRequest();
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);

    const [discordUsername, setDiscordUsername] = useState(user.discordUsername);
    const [disableBookingNotifications, setDisableBookingNotifications] = useState(
        user.disableBookingNotifications,
    );
    const [disableCancellationNotifications, setDisableCancellationNotifications] = useState(
        user.disableCancellationNotifications,
    );

    const onSave = () => {
        const update: Partial<User> = {
            disableBookingNotifications,
            disableCancellationNotifications,
        };
        if (discordUsername.trim() !== '') {
            update.discordUsername = discordUsername.trim();
        }

        request.onStart();
        api.updateUser(update)
            .then(onNextStep)
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    const onClickLink = (e: React.MouseEvent) => {
        e.preventDefault();
        setUpsellDialogOpen(true);
    };

    return (
        <Stack spacing={4}>
            {isFreeTier && (
                <UpsellDialog
                    open={upsellDialogOpen}
                    onClose={setUpsellDialogOpen}
                    currentAction={RestrictedAction.JoinDiscord}
                />
            )}

            <Typography>
                We have an <strong>optional</strong> private Discord available only to those in the
                training program.{' '}
                <Link
                    href={isFreeTier ? undefined : 'https://discord.gg/br4MB6ur66'}
                    target='_blank'
                    rel='noreferrer'
                    onClick={isFreeTier ? onClickLink : undefined}
                    sx={{ cursor: 'pointer' }}
                >
                    Joining
                </Link>{' '}
                will allow you to message other members in the program, hear about new
                announcements, participate in group study sessions and receive notifications about
                meetings.
            </Typography>

            <TextField
                label='Discord Username'
                value={discordUsername}
                onChange={(event) => setDiscordUsername(event.target.value)}
                helperText={'Format as username#id for older-style Discord usernames'}
            />

            <Stack>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={!disableBookingNotifications}
                            onChange={(event) =>
                                setDisableBookingNotifications(!event.target.checked)
                            }
                        />
                    }
                    label='Notify me via a Discord DM when my availability is booked'
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={!disableCancellationNotifications}
                            onChange={(event) =>
                                setDisableCancellationNotifications(!event.target.checked)
                            }
                        />
                    }
                    label='Notify me via a Discord DM when my meeting is cancelled'
                />
            </Stack>

            <Stack direction='row' justifyContent='space-between'>
                <Button disabled={request.isLoading()} onClick={onPrevStep} variant='contained'>
                    Back
                </Button>

                <LoadingButton
                    loading={request.isLoading()}
                    variant='contained'
                    onClick={onSave}
                    sx={{ alignSelf: 'end' }}
                >
                    Next
                </LoadingButton>
            </Stack>

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default DiscordForm;
