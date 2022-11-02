import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material';

import { useNavigate } from 'react-router-dom';
import { AuthStatus, useAuth } from '../auth/Auth';

const Navbar = () => {
    const navigate = useNavigate();
    const auth = useAuth();

    return (
        <AppBar position='sticky'>
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
                                    Meetings
                                </Button>

                                <Button
                                    onClick={() => navigate('/profile')}
                                    sx={{ color: 'white' }}
                                >
                                    Profile
                                </Button>
                            </Box>

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
