import React, { useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import {
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
import MerchIcon from '@mui/icons-material/Sell';

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

interface NavbarItem {
    name: string;
    icon: JSX.Element | null;
    onClick: () => void;
}

function allStartItems(navigate: NavigateFunction): NavbarItem[] {
    return [
        {
            name: 'Profile',
            icon: <Person2Icon />,
            onClick: () => navigate('/profile'),
        },
        {
            name: 'Scoreboard',
            icon: <ScoreboardIcon />,
            onClick: () => navigate('/scoreboard'),
        },
        {
            name: 'Games',
            icon: <PawnIcon />,
            onClick: () => navigate('/games'),
        },
        {
            name: 'Calendar',
            icon: <CalendarTodayIcon />,
            onClick: () => navigate('/calendar'),
        },
        {
            name: 'Meetings',
            icon: <GroupsIcon />,
            onClick: () => navigate('/meeting'),
        },
        {
            name: 'Recent',
            icon: <ScheduleIcon />,
            onClick: () => navigate('/recent'),
        },
        {
            name: 'Material',
            icon: <MenuBookIcon />,
            onClick: () => navigate('/material'),
        },
        {
            name: 'Merch',
            icon: <MerchIcon />,
            onClick: () => window.open('https://www.chessdojo.club/shop', '_blank'),
        },
    ];
}

function helpItem(navigate: NavigateFunction): NavbarItem {
    return {
        name: 'Help',
        icon: <HelpIcon />,
        onClick: () => navigate('/help'),
    };
}

function signoutItem(signout: () => void): NavbarItem {
    return {
        name: 'Sign Out',
        icon: <LogoutIcon color='error' />,
        onClick: signout,
    };
}

function adminPortalItem(navigate: NavigateFunction): NavbarItem {
    return {
        name: 'Admin Portal',
        icon: null,
        onClick: () => navigate('/admin'),
    };
}

function useNavbarItems() {
    const auth = useAuth();
    const navigate = useNavigate();

    const showAll = useMediaQuery('(min-width:1336px)');
    const hide2 = useMediaQuery('(min-width:1205px)');
    const hide3 = useMediaQuery('(min-width:1000px)');
    const hide4 = useMediaQuery('(min-width:870px)');
    const hide5 = useMediaQuery('(min-width:735px)');
    const showHelp = useMediaQuery('(min-width:635px)');
    const showSignout = useMediaQuery('(min-width:556px)');

    const startItems = allStartItems(navigate);

    let startItemCount = 0;
    if (showAll) {
        startItemCount = startItems.length;
    } else if (hide2) {
        startItemCount = startItems.length - 2;
    } else if (hide3) {
        startItemCount = startItems.length - 3;
    } else if (hide4) {
        startItemCount = startItems.length - 4;
    } else if (hide5) {
        startItemCount = startItems.length - 5;
    } else {
        startItemCount = startItems.length - 6;
    }

    const shownStartItems: NavbarItem[] = startItems.slice(0, startItemCount);
    const menuItems: NavbarItem[] = startItems.slice(startItemCount);
    const endItems: NavbarItem[] = [];

    if (showHelp) {
        endItems.push(helpItem(navigate));
    } else {
        menuItems.push(helpItem(navigate));
    }

    if (showSignout) {
        endItems.push(signoutItem(auth.signout));
    } else {
        menuItems.push(signoutItem(auth.signout));
    }

    if (auth.user?.isAdmin) {
        if (showAll) {
            endItems.push(adminPortalItem(navigate));
        } else {
            menuItems.push(adminPortalItem(navigate));
        }
    }

    return {
        startItems: shownStartItems,
        menuItems: menuItems,
        endItems: endItems,
    };
}

const LargeMenu: React.FC<MenuProps> = ({ meetingText }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { startItems, menuItems, endItems } = useNavbarItems();

    if (auth.status === AuthStatus.Unauthenticated) {
        return <LargeMenuUnauthenticated />;
    }
    if (auth.user?.isForbidden) {
        return <LargeMenuForbidden />;
    }

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

    if (!profileCreated) {
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
                </Stack>

                <Button onClick={() => navigate('/help')} sx={{ color: 'white' }}>
                    Help
                </Button>

                <Button onClick={auth.signout} sx={{ color: 'white' }}>
                    Sign Out
                </Button>
            </>
        );
    }

    return (
        <>
            <Logo />
            <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                {startItems.map((item) => (
                    <Button
                        key={item.name}
                        onClick={item.onClick}
                        sx={{ color: 'white' }}
                        startIcon={item.icon}
                    >
                        {item.name} {item.name === 'Meetings' && meetingText}
                    </Button>
                ))}

                {menuItems.length > 0 && (
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
                            {menuItems.map((item) => (
                                <MenuItem
                                    key={item.name}
                                    onClick={handleClick(item.onClick)}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <Typography textAlign='center'>
                                        {item.name}{' '}
                                        {item.name === 'Meetings' && meetingText}
                                    </Typography>
                                </MenuItem>
                            ))}
                        </Menu>
                    </>
                )}
            </Stack>

            {endItems.map((item) => (
                <Button key={item.name} onClick={item.onClick} sx={{ color: 'white' }}>
                    {item.name}
                </Button>
            ))}
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

    const startItems = allStartItems(navigate);

    if (auth.status === AuthStatus.Unauthenticated) {
        return <ExtraSmallMenuUnauthenticated />;
    }
    if (auth.user?.isForbidden) {
        return <ExtraSmallMenuForbidden />;
    }

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

    let startItemsJsx: JSX.Element[] = [];
    if (profileCreated) {
        startItemsJsx = startItems.slice(1).map((item) => (
            <MenuItem key={item.name} onClick={handleClick(item.onClick)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <Typography textAlign='center'>
                    {item.name} {item.name === 'Meetings' && meetingText}
                </Typography>
            </MenuItem>
        ));
    }

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
                <MenuItem onClick={handleClick(startItems[0].onClick)}>
                    <ListItemIcon>{startItems[0].icon}</ListItemIcon>
                    <Typography textAlign='center'>{startItems[0].name}</Typography>
                </MenuItem>

                {startItemsJsx}

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
