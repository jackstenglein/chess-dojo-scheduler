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
        if (mode === 'connect') {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code) {
                const payload = {
                    code,
                    ispaid: user.subscriptionStatus === SubscriptionStatus.Subscribed,
                    cohort: user.dojoCohort,
                    dojousernamekey: user.username,
                };

                fetch(
                    `${process.env.NEXT_PUBLIC_BETA_API_BASE_URL}/verify?mode=connect`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    },
                )
                    .then(async (res) => {
                        let data;
                        try {
                            data = await res.json();
                        } catch (error) {
                            console.error('Failed to parse JSON:', error);
                            throw new Error('Invalid response from server');
                        }

                        if (res.ok) {
                            setModalMessage(
                                data?.verification || 'Successfully connected!',
                            );
                            setIsSuccess(true);
                        } else {
                            setModalMessage(
                                data?.error || 'Failed to connect with Discord',
                            );
                            setIsSuccess(false);
                        }
                    })
                    .catch((err) => {
                        console.error('Error:', err.message);
                        setModalMessage('An unexpected error occurred.');
                        setIsSuccess(false);
                    })
                    .finally(() => {
                        setModalOpen(true);
                    });
            }
        }
    }, [user, mode]);

    const handleConnect = () => {
        window.location.href = DISCORD_AUTH_URL;
    };

    const handleDisconnect = () => {
        const payload = { dojousernamekey: user.username };

        fetch(`${process.env.NEXT_PUBLIC_BETA_API_BASE_URL}/verify?mode=disconnect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                const data = await res.json();
                if (res.status === 200) {
                    setModalMessage(data.verification || 'Successfully disconnected!');
                    setIsSuccess(true);
                } else {
                    setModalOpen(false);
                    setModalMessage(data.error || 'Failed to disconnect from Discord');
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
    };

    const handleClose = () => {
        setModalOpen(false);
    };

    return (
        <>
            <Stack spacing={2} alignItems='start'>
                {mode === 'connect' ? (
                    <Button
                        variant='contained'
                        sx={{ backgroundColor: '#5865f2' }}
                        startIcon={<DiscordIcon />}
                        onClick={handleConnect}
                    >
                        Connect Discord account
                    </Button>
                ) : (
                    <Button
                        variant='contained'
                        sx={{ backgroundColor: '#AB080A' }}
                        startIcon={<DiscordIcon />}
                        onClick={handleDisconnect}
                    >
                        Disconnect Discord account
                    </Button>
                )}
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
