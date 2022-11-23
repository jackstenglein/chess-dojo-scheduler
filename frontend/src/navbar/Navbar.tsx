import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { useMeetings } from '../api/Cache';
import { AuthStatus, useAuth } from '../auth/Auth';
import { Meeting } from '../database/meeting';

const ONE_HOUR = 3600000;

const Navbar = () => {
    const navigate = useNavigate();
    const auth = useAuth();
    const isAdmin = auth.user?.isAdmin || false;

    const filterTime = new Date(new Date().getTime() - ONE_HOUR).toISOString();
    const { meetings } = useMeetings();
    const meetingCount = meetings.filter(
        (m: Meeting) => m.startTime >= filterTime
    ).length;
    const meetingText = meetingCount > 0 ? `Meetings (${meetingCount})` : `Meetings`;

    return (
        <AppBar position='sticky' sx={{ zIndex: 1400 }}>
            <Container maxWidth='xl'>
                <Toolbar disableGutters>
                    <Typography
                        variant='h6'
                        noWrap
                        onClick={() => navigate('/calendar')}
                        sx={{
                            mr: 3,
                            ml: 1,
                            display: { xs: 'none', md: 'flex' },
                            fontWeight: 700,
                            color: 'inherit',
                            textDecoration: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Chess Dojo Scheduler
                    </Typography>

                    {auth.status === AuthStatus.Authenticated && (
                        <>
                            <Box sx={{ flexGrow: 1 }}>
                                <Button
                                    onClick={() => navigate('/calendar')}
                                    sx={{ color: 'white' }}
                                >
                                    Calendar
                                </Button>

                                <Button
                                    onClick={() => navigate('/meeting')}
                                    sx={{ color: 'white' }}
                                >
                                    {meetingText}
                                </Button>

                                <Button
                                    onClick={() => navigate('/profile')}
                                    sx={{ color: 'white' }}
                                >
                                    Profile
                                </Button>
                            </Box>

                            {isAdmin && (
                                <Button
                                    onClick={() => navigate('/admin')}
                                    sx={{ color: 'white' }}
                                >
                                    Admin Portal
                                </Button>
                            )}

                            <Button onClick={auth.signout} sx={{ color: 'white' }}>
                                Sign Out
                            </Button>
                        </>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;
