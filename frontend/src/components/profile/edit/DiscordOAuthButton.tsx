import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { getConfig } from '@/config';
import { User } from '@/database/user';
import { DiscordIcon } from '@/style/SocialMediaIcons';
import { Button, Stack, Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const config = getConfig();
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${config.discord.clientId}&redirect_uri=${config.discord.oauthRedirectUrl}&response_type=code&scope=identify%20guilds.join`;

function DiscordOAuthButton({ user }: { user: User }) {
    const { updateUser } = useAuth();
    const api = useApi();
    const request = useRequest<string>();
    const params = useSearchParams();
    const mode = user.discordId ? 'disconnect' : 'connect';
    const code = params.get('code');

    useEffect(() => {
        if (mode === 'connect' && code && !request.isSent()) {
            request.onStart();
            api.discordAuth({ mode: 'connect', code })
                .then((resp) => {
                    request.onSuccess(`Discord account successfully connected!`);
                    updateUser(resp.data);
                })
                .catch((err) => {
                    console.error('discordAuth: ', err);
                    request.onFailure(err);
                });
        }
    }, [mode, code, request, api, updateUser]);

    const handleDisconnect = () => {
        request.onStart();
        api.discordAuth({ mode: 'disconnect' })
            .then(() => {
                request.onSuccess('Discord account disconnected.');
                updateUser({ discordUsername: '', discordId: '' });
            })
            .catch((err) => {
                console.error('discordAuth: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            {mode === 'connect' ? (
                <Stack direction='row' alignItems='center'>
                    <Button
                        variant='contained'
                        loading={request.isLoading()}
                        startIcon={<DiscordIcon />}
                        href={DISCORD_AUTH_URL}
                    >
                        Connect Discord
                    </Button>
                </Stack>
            ) : (
                <Stack direction='row' alignItems='center'>
                    <DiscordIcon />
                    <Typography sx={{ ml: 1, mr: 2 }}>{user.discordUsername}</Typography>
                    <Button
                        variant='contained'
                        color='error'
                        loading={request.isLoading()}
                        onClick={handleDisconnect}
                    >
                        Disconnect Discord
                    </Button>
                </Stack>
            )}

            <RequestSnackbar request={request} showSuccess />
        </>
    );
}

export default DiscordOAuthButton;
