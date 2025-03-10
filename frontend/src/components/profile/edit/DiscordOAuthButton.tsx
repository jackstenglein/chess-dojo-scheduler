import { SubscriptionStatus, User } from '@/database/user';
import { DiscordIcon } from '@/style/SocialMediaIcons';
import { Box, Button, Modal, Stack, Typography, useTheme } from '@mui/material';
import { useEffect, useState } from 'react';

const ClientID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
const RedirectUrl = process.env.NEXT_PUBLIC_AUTH_OAUTH_DISCORD_REDIRECT_URL;
const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?client_id=${ClientID}&redirect_uri=${RedirectUrl}&response_type=code&scope=identify%20guilds.join`;

type DiscordOAuthButtonProps = {
    user: User;
};

function DiscordOAuthButton({ user }: DiscordOAuthButtonProps) {
    const theme = useTheme();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [mode, setMode] = useState<'connect' | 'disconnect'>(
        user.discordUsername ? 'disconnect' : 'connect',
    );

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            if (sessionStorage.getItem('discord_code') === code) return;

            sessionStorage.setItem('discord_code', code);

            const payload =
                mode === 'connect'
                    ? {
                          code,
                          ispaid:
                              user.subscriptionStatus === SubscriptionStatus.Subscribed,
                          cohort: user.dojoCohort,
                      }
                    : { code };

            fetch(
                `${process.env.NEXT_PUBLIC_BETA_API_BASE_URL}/Prod/verify?mode=${mode}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                },
            )
                .then(async (res) => {
                    const data = await res.json();
                    if (res.ok) {
                        setModalMessage(
                            data.verification ||
                                (mode === 'connect'
                                    ? 'Successfully connected!'
                                    : 'Successfully disconnected!'),
                        );
                        setIsSuccess(true);
                    } else {
                        setModalMessage(data.error || `Failed to ${mode} with Discord`);
                        setIsSuccess(false);
                    }
                    setModalOpen(true);
                })
                .catch((err) => {
                    console.error('Error:', err);
                    setModalMessage('An unexpected error occurred.');
                    setIsSuccess(false);
                    setModalOpen(true);
                });
        }
    }, [user, mode]);

    const handleButtonClick = () => {
        window.location.href = DISCORD_AUTH_URL;
    };

    const handleClose = () => {
        setModalOpen(false);
    };

    return (
        <>
            <Stack spacing={2} alignItems='start'>
                <Button
                    variant='contained'
                    sx={{ backgroundColor: mode === 'connect' ? '#5865f2' : '#AB080A' }}
                    startIcon={<DiscordIcon />}
                    onClick={handleButtonClick}
                >
                    {mode === 'connect'
                        ? 'Connect Discord account'
                        : 'Disconnect Discord account'}
                </Button>
            </Stack>

            <Modal open={modalOpen} onClose={handleClose}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        bgcolor: theme.palette.background.paper,
                        boxShadow: theme.shadows[5],
                        p: theme.spacing(4),
                        borderRadius: theme.shape.borderRadius,
                    }}
                >
                    <Typography
                        variant='h6'
                        color={isSuccess ? 'success.main' : 'error.main'}
                    >
                        {isSuccess ? 'Success!' : 'Error'}
                    </Typography>
                    <Typography sx={{ mt: 2 }}>{modalMessage}</Typography>
                    <Button variant='contained' onClick={handleClose} sx={{ mt: 2 }}>
                        Close
                    </Button>
                </Box>
            </Modal>
        </>
    );
}

export default DiscordOAuthButton;
