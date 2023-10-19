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
    Badge,
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
import TournamentsIcon from '@mui/icons-material/EmojiEvents';
import NotificationsIcon from '@mui/icons-material/Notifications';

import { AuthStatus, useAuth } from '../auth/Auth';
import PawnIcon from './PawnIcon';
import { hasCreatedProfile } from '../database/user';
import NotificationButton from '../notifications/NotificationButton';
import { useNotifications } from '../api/cache/Cache';

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
                <Button
                    onClick={() => navigate('/tournaments')}
                    sx={{ color: 'white' }}
                    startIcon={<TournamentsIcon />}
                >
                    Tournaments
                </Button>
                <Button
                    href='https://www.chessdojo.club/shop'
                    target='_blank'
                    rel='noopener'
                    sx={{ color: 'white' }}
                    startIcon={<MerchIcon />}
                >
                    Merch
                </Button>
            </Stack>
            <Stack spacing={1} direction='row'>
                <Button onClick={() => navigate('/signin')} sx={{ color: 'white' }}>
                    Sign In
                </Button>
                <Button onClick={() => navigate('/signup')} sx={{ color: 'white' }}>
                    Sign Up
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
            name: 'Tournaments',
            icon: <TournamentsIcon />,
            onClick: () => navigate('/tournaments'),
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

function NotificationsMenuItem({
    handleClick,
}: {
    handleClick: (func: () => void) => () => void;
}): JSX.Element {
    const { notifications } = useNotifications();
    const navigate = useNavigate();

    return (
        <MenuItem onClick={handleClick(() => navigate('/notifications'))}>
            <ListItemIcon>
                <Badge
                    badgeContent={notifications.length}
                    color='secondary'
                    overlap='circular'
                >
                    <NotificationsIcon />
                </Badge>
            </ListItemIcon>
            <Typography textAlign='center'>Notifications</Typography>
        </MenuItem>
    );
}

function renderStartItem(item: NavbarItem, meetingText: string) {
    return (
        <Button
            key={item.name}
            onClick={item.onClick}
            sx={{ color: 'white', whiteSpace: 'nowrap' }}
            startIcon={item.icon}
        >
            {item.name} {item.name === 'Meetings' && meetingText}
        </Button>
    );
}

function renderMenuItem(
    item: NavbarItem,
    handleClick: (func: () => void) => () => void,
    meetingText?: string
) {
    return (
        <MenuItem key={item.name} onClick={handleClick(item.onClick)}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <Typography textAlign='center'>
                {item.name} {item.name === 'Meetings' && meetingText}
            </Typography>
        </MenuItem>
    );
}

function renderEndItem(item: NavbarItem) {
    return (
        <Button
            key={item.name}
            onClick={item.onClick}
            sx={{ color: 'white', whiteSpace: 'nowrap' }}
        >
            {item.name}
        </Button>
    );
}

function useNavbarItems(
    meetingText: string,
    handleClick: (func: () => void) => () => void
) {
    const auth = useAuth();
    const navigate = useNavigate();

    const showAll = useMediaQuery('(min-width:1448px)');
    const hide2 = useMediaQuery('(min-width:1319px)');
    const hide3 = useMediaQuery('(min-width:1210px)');
    const hide4 = useMediaQuery('(min-width:1064px)');
    const hide5 = useMediaQuery('(min-width:937px)');
    const hide6 = useMediaQuery('(min-width:836px)');
    const showHelp = useMediaQuery('(min-width:676px)');
    const showSignout = useMediaQuery('(min-width:612px)');
    const showNotifications = useMediaQuery('(min-width:502px)');

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
    } else if (hide6) {
        startItemCount = startItems.length - 6;
    } else {
        startItemCount = startItems.length - 7;
    }

    const shownStartItems: JSX.Element[] = startItems
        .slice(0, startItemCount)
        .map((item) => renderStartItem(item, meetingText));

    const menuItems: JSX.Element[] = startItems
        .slice(startItemCount)
        .map((item) => renderMenuItem(item, handleClick, meetingText));

    const endItems: JSX.Element[] = [];

    if (showNotifications) {
        endItems.push(<NotificationButton key='notifications' />);
    } else {
        menuItems.push(
            <NotificationsMenuItem key='notifications' handleClick={handleClick} />
        );
    }

    if (showHelp) {
        endItems.push(renderEndItem(helpItem(navigate)));
    } else {
        menuItems.push(renderMenuItem(helpItem(navigate), handleClick));
    }

    if (showSignout) {
        endItems.push(renderEndItem(signoutItem(auth.signout)));
    } else {
        menuItems.push(renderMenuItem(signoutItem(auth.signout), handleClick));
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

    const { startItems, menuItems, endItems } = useNavbarItems(meetingText, handleClick);

    if (auth.status === AuthStatus.Unauthenticated) {
        return <LargeMenuUnauthenticated />;
    }

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
                {startItems}

                {menuItems.length > 0 && (
                    <>
                        <Button
                            data-cy='navbar-more-button'
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
                            {menuItems}
                        </Menu>
                    </>
                )}
            </Stack>

            {endItems}
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
                data-cy='navbar-more-button'
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
                    <Typography textAlign='center'>Sign In</Typography>
                </MenuItem>
                <MenuItem onClick={handleClick(() => navigate('/signup'))}>
                    <Typography textAlign='center'>Sign Up</Typography>
                </MenuItem>
                <MenuItem onClick={handleClick(() => navigate('/tournaments'))}>
                    <Typography textAlign='center'>Tournaments</Typography>
                </MenuItem>
                <MenuItem
                    onClick={() =>
                        window.open('https://www.chessdojo.club/shop', '_blank')
                    }
                >
                    <Typography textAlign='center'>Merch</Typography>
                </MenuItem>
            </Menu>
        </Stack>
    );
};

const ExtraSmallMenu: React.FC<MenuProps> = ({ meetingText }) => {
    const auth = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { notifications } = useNotifications();

    const startItems = allStartItems(navigate);

    if (auth.status === AuthStatus.Unauthenticated) {
        return <ExtraSmallMenuUnauthenticated />;
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
                data-cy='navbar-more-button'
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

                <MenuItem onClick={handleClick(() => navigate('/notifications'))}>
                    <ListItemIcon>
                        <Badge
                            badgeContent={notifications.length}
                            color='secondary'
                            overlap='circular'
                        >
                            <NotificationsIcon />
                        </Badge>
                    </ListItemIcon>
                    <Typography textAlign='center'>Notifications</Typography>
                </MenuItem>

                <MenuItem onClick={handleClick(() => navigate('/help'))}>
                    <ListItemIcon>
                        <HelpIcon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Help</Typography>
                </MenuItem>

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
