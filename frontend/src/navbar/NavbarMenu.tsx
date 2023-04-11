import {
    Box,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';

import { AuthStatus, useAuth } from '../auth/Auth';
import { useState } from 'react';

interface MenuProps {
    meetingText: string;
}

const LargeMenu: React.FC<MenuProps> = ({ meetingText }) => {
    const auth = useAuth();
    const isAdmin = auth.user?.isAdmin;
    const isBetaTester = auth.user?.isBetaTester;
    const navigate = useNavigate();

    return (
        <>
            <Box sx={{ flexGrow: 1 }}>
                <Button onClick={() => navigate('/home')} sx={{ color: 'white' }}>
                    Home
                </Button>

                <Button onClick={() => navigate('/calendar')} sx={{ color: 'white' }}>
                    Calendar
                </Button>

                <Button onClick={() => navigate('/meeting')} sx={{ color: 'white' }}>
                    {meetingText}
                </Button>

                <Button onClick={() => navigate('/games')} sx={{ color: 'white' }}>
                    Games
                </Button>

                {(isAdmin || isBetaTester) && (
                    <Button
                        onClick={() => navigate('/scoreboard')}
                        sx={{ color: 'white' }}
                    >
                        Scoreboard
                    </Button>
                )}

                <Button onClick={() => navigate('/profile')} sx={{ color: 'white' }}>
                    Profile
                </Button>
            </Box>

            {isAdmin && (
                <Box>
                    <Button onClick={() => navigate('/admin')} sx={{ color: 'white' }}>
                        Admin Portal
                    </Button>
                </Box>
            )}

            {(isAdmin || isBetaTester) && (
                <Button onClick={() => navigate('/help')} sx={{ color: 'white' }}>
                    Help
                </Button>
            )}

            <Button onClick={auth.signout} sx={{ color: 'white' }}>
                Sign Out
            </Button>
        </>
    );
};

const SmallMenu: React.FC<MenuProps> = ({ meetingText }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isAdmin = auth.user?.isAdmin;
    const isBetaTester = auth.user?.isBetaTester;

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClick = (func: () => void) => {
        return () => {
            func();
            handleClose();
        };
    };

    return (
        <Box>
            <IconButton
                size='medium'
                aria-label='navigation menu'
                aria-controls='menu-appbar'
                aria-haspopup='true'
                onClick={handleOpen}
                color='inherit'
            >
                <MenuIcon />
            </IconButton>
            <Menu
                id='menu-appbar'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <MenuItem onClick={handleClick(() => navigate('/home'))}>
                    <Typography textAlign='center'>Home</Typography>
                </MenuItem>
                <MenuItem onClick={handleClick(() => navigate('/calendar'))}>
                    <Typography textAlign='center'>Calendar</Typography>
                </MenuItem>
                <MenuItem onClick={handleClick(() => navigate('/meeting'))}>
                    <Typography textAlign='center'>{meetingText}</Typography>
                </MenuItem>
                <MenuItem onClick={handleClick(() => navigate('/games'))}>
                    <Typography textAlign='center'>Game Database</Typography>
                </MenuItem>
                {(isAdmin || isBetaTester) && (
                    <MenuItem onClick={handleClick(() => navigate('/scoreboard'))}>
                        <Typography textAlign='center'>Scoreboard</Typography>
                    </MenuItem>
                )}
                <MenuItem onClick={handleClick(() => navigate('/profile'))}>
                    <Typography textAlign='center'>Profile</Typography>
                </MenuItem>
                {isAdmin && (
                    <MenuItem onClick={handleClick(() => navigate('/admin'))}>
                        <Typography textAlign='center'>Admin Portal</Typography>
                    </MenuItem>
                )}
                {(isAdmin || isBetaTester) && (
                    <MenuItem onClick={handleClick(() => navigate('/help'))}>
                        <Typography textAlign='center'>Help</Typography>
                    </MenuItem>
                )}
                <MenuItem onClick={handleClick(auth.signout)}>
                    <Typography textAlign='center' color='error'>
                        Sign Out
                    </Typography>
                </MenuItem>
            </Menu>
        </Box>
    );
};

const NavbarMenu: React.FC<MenuProps> = ({ meetingText }) => {
    const auth = useAuth();
    const largeMenu = useMediaQuery((theme: any) => theme.breakpoints.up('sm'));

    if (auth.status !== AuthStatus.Authenticated) {
        return null;
    }

    if (largeMenu) {
        return <LargeMenu meetingText={meetingText} />;
    }

    return <SmallMenu meetingText={meetingText} />;
};

export default NavbarMenu;
