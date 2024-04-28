import {
    ChevronRight,
    ContactSupport,
    ExpandLess,
    ExpandMore,
    Menu as MenuIcon,
    Sell,
    EmojiEvents as Tournaments,
} from '@mui/icons-material';
import {
    Button,
    Collapse,
    IconButton,
    List,
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from '@mui/material';
import React, { useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { Logo, NavMenuItem, NavbarItem, StartItem } from './NavbarMenu';
import SocialIcons from './SocialIcons';

const UnauthenticatedMenu = () => {
    const largeMenu = useMediaQuery('(min-width:450px)');
    if (largeMenu) {
        return <LargeMenuUnauthenticated />;
    }
    return <ExtraSmallMenuUnauthenticated />;
};

export default UnauthenticatedMenu;

function unauthenticatedStartItems(
    navigate: NavigateFunction,
    toggleExpansion: (item: string) => void,
): NavbarItem[] {
    return [
        {
            name: 'Tournaments',
            icon: <Tournaments />,
            onClick: () => toggleExpansion('Tournaments'),
            children: [
                {
                    name: 'DojoLiga',
                    icon: null,
                    onClick: () => navigate('/tournaments'),
                },
                {
                    name: 'Open Classical',
                    icon: null,
                    onClick: () => navigate('/tournaments/open-classical'),
                },
            ],
        },
        {
            name: 'Shop',
            icon: <Sell />,
            onClick: () => toggleExpansion('Shop'),
            children: [
                {
                    name: 'Courses',
                    icon: null,
                    onClick: () => navigate('/courses'),
                },
                {
                    name: 'Coaching',
                    icon: null,
                    onClick: () => navigate('/coaching'),
                },
                {
                    name: 'Merch',
                    icon: null,
                    onClick: () =>
                        window.open('https://www.chessdojo.club/shop', '_blank'),
                },
            ],
        },
        {
            name: 'Contact Us',
            icon: <ContactSupport />,
            onClick: () => navigate('/help'),
        },
    ];
}

function useNavbarItems(handleClick: (func: () => void) => () => void) {
    const navigate = useNavigate();
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const showAll = useMediaQuery('(min-width:725px)');
    const hide2 = useMediaQuery('(min-width:600px)');

    const startItems = unauthenticatedStartItems(navigate, (item: string) =>
        setOpenItems((v) => ({ ...v, [item]: !(v[item] || false) })),
    );

    let startItemCount = 0;
    if (showAll) {
        startItemCount = startItems.length;
    } else if (hide2) {
        startItemCount = startItems.length - 2;
    }

    const shownStartItems: JSX.Element[] = startItems
        .slice(0, startItemCount)
        .map((item) => <StartItem key={item.name} item={item} meetingCount={0} />);

    const menuItems: JSX.Element[] = startItems
        .slice(startItemCount)
        .map((item) => (
            <NavMenuItem
                key={item.name}
                item={item}
                openItems={openItems}
                handleClick={handleClick}
                meetingCount={0}
            />
        ));

    return {
        startItems: shownStartItems,
        menuItems: menuItems,
    };
}

export const LargeMenuUnauthenticated = () => {
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

    const { startItems, menuItems } = useNavbarItems(handleClick);

    return (
        <>
            <Logo />
            <Stack spacing={1} direction='row' sx={{ flexGrow: 1 }}>
                {startItems}

                {menuItems.length > 0 && (
                    <>
                        <Tooltip title='More'>
                            <IconButton
                                data-cy='navbar-more-button'
                                onClick={handleOpen}
                                sx={{ color: 'white' }}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Tooltip>
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

                <SocialIcons />
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

export const ExtraSmallMenuUnauthenticated = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const startItems = unauthenticatedStartItems(navigate, (item: string) =>
        setOpenItems((v) => ({ ...v, [item]: !(v[item] || false) })),
    );

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
            setOpenItems({});
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

                {startItems.map((item) => [
                    <MenuItem
                        key={item.name}
                        onClick={item.children ? item.onClick : handleClick(item.onClick)}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <Typography textAlign='center'>{item.name}</Typography>
                        {item.children &&
                            (openItems[item.name] ? (
                                <ListItemIcon sx={{ position: 'absolute', right: 0 }}>
                                    <ExpandLess />
                                </ListItemIcon>
                            ) : (
                                <ListItemIcon sx={{ position: 'absolute', right: 0 }}>
                                    <ExpandMore />
                                </ListItemIcon>
                            ))}
                    </MenuItem>,
                    item.children ? (
                        <Collapse in={openItems[item.name]}>
                            <List component='div' disablePadding>
                                {item.children.map((child) => (
                                    <MenuItem
                                        key={child.name}
                                        onClick={handleClick(child.onClick)}
                                        sx={{ pl: 3 }}
                                    >
                                        {child.icon ? (
                                            <ListItemIcon>{child.icon}</ListItemIcon>
                                        ) : (
                                            <ListItemIcon>
                                                <ChevronRight />
                                            </ListItemIcon>
                                        )}
                                        <Typography textAlign='center'>
                                            {child.name}
                                        </Typography>
                                    </MenuItem>
                                ))}
                            </List>
                        </Collapse>
                    ) : null,
                ])}
            </Menu>
        </Stack>
    );
};
