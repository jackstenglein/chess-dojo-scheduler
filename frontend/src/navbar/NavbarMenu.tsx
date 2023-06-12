import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    Typography,
    useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Person2Icon from '@mui/icons-material/Person2';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupsIcon from '@mui/icons-material/Groups';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HelpIcon from '@mui/icons-material/Help';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import { AuthStatus, useAuth } from '../auth/Auth';
import PawnIcon from './PawnIcon';
import { hasCreatedProfile } from '../database/user';

const Logo = () => {
    const navigate = useNavigate();
    return (
        <img
            src='/logo192.png'
            style={{
                paddingTop: '10px',
                paddingBottom: '10px',
                maxHeight: '100%',
                marginRight: '15px',
                cursor: 'pointer',
            }}
            alt=''
            onClick={() => navigate('/')}
        />
    );
};

interface MenuProps {
    meetingText: string;
}

const LargeMenuUnauthenticated = () => {
    const navigate = useNavigate();

    return (
        <>
            <Logo />
            <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                <Typography color='white'>Chess Dojo Scoreboard</Typography>
            </Stack>
            <Stack spacing={1} direction='row'>
                <Button onClick={() => navigate('/signin')} sx={{ color: 'white' }}>
                    Signin
                </Button>
                <Button onClick={() => navigate('/signup')} sx={{ color: 'white' }}>
                    Signup
                </Button>
            </Stack>
        </>
    );
};

const LargeMenuForbidden = () => {
    const auth = useAuth();

    return (
        <>
            <Logo />
            <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                Chess Dojo Scoreboard
            </Stack>
            <Stack spacing={1} direction='row'>
                <Button onClick={auth.signout} sx={{ color: 'white' }}>
                    Sign Out
                </Button>
            </Stack>
        </>
    );
};

const LargeMenu: React.FC<MenuProps> = ({ meetingText }) => {
    const auth = useAuth();
    const isAdmin = auth.user?.isAdmin;
    const navigate = useNavigate();

    const showMaterialAndRecent = useMediaQuery('(min-width:1130px)');
    const showMeetings = useMediaQuery('(min-width:1000px)');
    const showCalendar = useMediaQuery('(min-width:870px)');
    const showGames = useMediaQuery('(min-width:735px)');
    const showHelp = useMediaQuery('(min-width:623px)');
    const showSignout = useMediaQuery('(min-width:556px)');

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    if (auth.status === AuthStatus.Unauthenticated) {
        return <LargeMenuUnauthenticated />;
    }
    // if (auth.user?.isForbidden) {
    //     return <LargeMenuForbidden />;
    // }

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

    const profileCreated = hasCreatedProfile(auth.user!);

    return (
        <>
            <Logo />
            <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                <Button
                    onClick={() => navigate('/profile')}
                    sx={{ color: 'white' }}
                    startIcon={<Person2Icon />}
                >
                    Profile
                </Button>

                {profileCreated && (
                    <>
                        <Button
                            onClick={() => navigate('/scoreboard')}
                            sx={{ color: 'white' }}
                            startIcon={<ScoreboardIcon />}
                        >
                            Scoreboard
                        </Button>

                        {showGames && (
                            <Button
                                onClick={() => navigate('/games')}
                                sx={{ color: 'white' }}
                                startIcon={<PawnIcon />}
                            >
                                Games
                            </Button>
                        )}

                        {showCalendar && (
                            <Button
                                onClick={() => navigate('/calendar')}
                                sx={{ color: 'white' }}
                                startIcon={<CalendarTodayIcon />}
                            >
                                Calendar
                            </Button>
                        )}

                        {showMeetings && (
                            <Button
                                onClick={() => navigate('/meeting')}
                                sx={{ color: 'white' }}
                                startIcon={<GroupsIcon />}
                            >
                                {meetingText}
                            </Button>
                        )}

                        {showMaterialAndRecent && (
                            <>
                                <Button
                                    onClick={() => navigate('/recent')}
                                    sx={{ color: 'white' }}
                                    startIcon={<ScheduleIcon />}
                                >
                                    Recent
                                </Button>

                                <Button
                                    onClick={() => navigate('/material')}
                                    sx={{ color: 'white' }}
                                    startIcon={<MenuBookIcon />}
                                >
                                    Material
                                </Button>
                            </>
                        )}

                        {!showMaterialAndRecent && (
                            <>
                                <Button
                                    onClick={handleOpen}
                                    sx={{ color: 'white' }}
                                    endIcon={<ExpandMoreIcon />}
                                >
                                    More
                                </Button>
                                <Menu
                                    id='menu-appbar'
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleClose}
                                >
                                    {!showGames && (
                                        <MenuItem
                                            onClick={handleClick(() =>
                                                navigate('/games')
                                            )}
                                        >
                                            <ListItemIcon>
                                                <PawnIcon />
                                            </ListItemIcon>
                                            <Typography textAlign='center'>
                                                Game Database
                                            </Typography>
                                        </MenuItem>
                                    )}
                                    {!showCalendar && (
                                        <MenuItem
                                            onClick={handleClick(() =>
                                                navigate('/calendar')
                                            )}
                                        >
                                            <ListItemIcon>
                                                <CalendarTodayIcon />
                                            </ListItemIcon>
                                            <Typography textAlign='center'>
                                                Calendar
                                            </Typography>
                                        </MenuItem>
                                    )}
                                    {!showMeetings && (
                                        <MenuItem
                                            onClick={handleClick(() =>
                                                navigate('/meeting')
                                            )}
                                        >
                                            <ListItemIcon>
                                                <GroupsIcon />
                                            </ListItemIcon>
                                            <Typography textAlign='center'>
                                                {meetingText}
                                            </Typography>
                                        </MenuItem>
                                    )}

                                    <MenuItem
                                        onClick={handleClick(() => navigate('/recent'))}
                                    >
                                        <ListItemIcon>
                                            <ScheduleIcon />
                                        </ListItemIcon>
                                        <Typography textAlign='center'>Recent</Typography>
                                    </MenuItem>

                                    <MenuItem
                                        onClick={handleClick(() => navigate('/material'))}
                                    >
                                        <ListItemIcon>
                                            <MenuBookIcon />
                                        </ListItemIcon>
                                        <Typography textAlign='center'>
                                            Material
                                        </Typography>
                                    </MenuItem>

                                    {!showHelp && (
                                        <MenuItem
                                            onClick={handleClick(() => navigate('/help'))}
                                        >
                                            <ListItemIcon>
                                                <HelpIcon />
                                            </ListItemIcon>
                                            <Typography textAlign='center'>
                                                Help
                                            </Typography>
                                        </MenuItem>
                                    )}
                                    {isAdmin && (
                                        <MenuItem
                                            onClick={handleClick(() =>
                                                navigate('/admin')
                                            )}
                                        >
                                            <Typography textAlign='center'>
                                                Admin Portal
                                            </Typography>
                                        </MenuItem>
                                    )}
                                    {!showSignout && (
                                        <MenuItem onClick={handleClick(auth.signout)}>
                                            <ListItemIcon>
                                                <LogoutIcon color='error' />
                                            </ListItemIcon>
                                            <Typography textAlign='center' color='error'>
                                                Sign Out
                                            </Typography>
                                        </MenuItem>
                                    )}
                                </Menu>
                            </>
                        )}
                    </>
                )}
            </Stack>

            {isAdmin && showMaterialAndRecent && (
                <Box>
                    <Button onClick={() => navigate('/admin')} sx={{ color: 'white' }}>
                        Admin Portal
                    </Button>
                </Box>
            )}

            {showHelp && (
                <Button onClick={() => navigate('/help')} sx={{ color: 'white' }}>
                    Help
                </Button>
            )}

            {showSignout && (
                <Button onClick={auth.signout} sx={{ color: 'white' }}>
                    Sign Out
                </Button>
            )}
        </>
    );
};

const ExtraSmallMenuUnauthenticated = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ flexGrow: 1, height: 1 }}
        >
            <Logo />
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
                <MenuItem onClick={handleClick(() => navigate('/signin'))}>
                    <Typography textAlign='center'>Signin</Typography>
                </MenuItem>
                <MenuItem onClick={handleClick(() => navigate('/signup'))}>
                    <Typography textAlign='center'>Signup</Typography>
                </MenuItem>
            </Menu>
        </Stack>
    );
};

const ExtraSmallMenuForbidden = () => {
    const auth = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ flexGrow: 1, height: 1 }}
        >
            <Logo />
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
                <MenuItem onClick={handleClick(auth.signout)}>
                    <ListItemIcon>
                        <LogoutIcon color='error' />
                    </ListItemIcon>
                    <Typography textAlign='center' color='error'>
                        Sign Out
                    </Typography>
                </MenuItem>
            </Menu>
        </Stack>
    );
};

const ExtraSmallMenu: React.FC<MenuProps> = ({ meetingText }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const isAdmin = auth.user?.isAdmin;

    if (auth.status === AuthStatus.Unauthenticated) {
        return <ExtraSmallMenuUnauthenticated />;
    }
    // if (auth.user?.isForbidden) {
    //     return <ExtraSmallMenuForbidden />;
    // }

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

    const profileCreated = hasCreatedProfile(auth.user!);

    return (
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            sx={{ flexGrow: 1, height: 1 }}
        >
            <Logo />
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
                <MenuItem onClick={handleClick(() => navigate('/profile'))}>
                    <ListItemIcon>
                        <Person2Icon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Profile</Typography>
                </MenuItem>
                {profileCreated && (
                    <>
                        <MenuItem onClick={handleClick(() => navigate('/scoreboard'))}>
                            <ListItemIcon>
                                <ScoreboardIcon />
                            </ListItemIcon>
                            <Typography textAlign='center'>Scoreboard</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleClick(() => navigate('/games'))}>
                            <ListItemIcon>
                                <PawnIcon />
                            </ListItemIcon>
                            <Typography textAlign='center'>Game Database</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleClick(() => navigate('/calendar'))}>
                            <ListItemIcon>
                                <CalendarTodayIcon />
                            </ListItemIcon>
                            <Typography textAlign='center'>Calendar</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleClick(() => navigate('/meeting'))}>
                            <ListItemIcon>
                                <GroupsIcon />
                            </ListItemIcon>
                            <Typography textAlign='center'>{meetingText}</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleClick(() => navigate('/recent'))}>
                            <ListItemIcon>
                                <ScheduleIcon />
                            </ListItemIcon>
                            <Typography textAlign='center'>Recent</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleClick(() => navigate('/material'))}>
                            <ListItemIcon>
                                <MenuBookIcon />
                            </ListItemIcon>
                            <Typography textAlign='center'>Material</Typography>
                        </MenuItem>
                    </>
                )}

                <MenuItem onClick={handleClick(() => navigate('/help'))}>
                    <ListItemIcon>
                        <HelpIcon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Help</Typography>
                </MenuItem>

                {isAdmin && (
                    <MenuItem onClick={handleClick(() => navigate('/admin'))}>
                        <Typography textAlign='center'>Admin Portal</Typography>
                    </MenuItem>
                )}

                <MenuItem onClick={handleClick(auth.signout)}>
                    <ListItemIcon>
                        <LogoutIcon color='error' />
                    </ListItemIcon>
                    <Typography textAlign='center' color='error'>
                        Sign Out
                    </Typography>
                </MenuItem>
            </Menu>
        </Stack>
    );
};

const NavbarMenu: React.FC<MenuProps> = ({ meetingText }) => {
    const auth = useAuth();
    const largeMenu = useMediaQuery('(min-width:450px)');

    if (auth.status === AuthStatus.Loading) {
        return <Logo />;
    }

    if (largeMenu) {
        return <LargeMenu meetingText={meetingText} />;
    }

    return <ExtraSmallMenu meetingText={meetingText} />;
};

export default NavbarMenu;
