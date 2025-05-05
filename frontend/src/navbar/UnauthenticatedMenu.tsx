'use client';

import { DonateIcon } from '@/style/DonateIcon';
import {
    AutoStories,
    ChevronRight,
    ContactSupport,
    ExpandLess,
    ExpandMore,
    Forum,
    ImportContacts,
    MenuBook,
    Menu as MenuIcon,
    RocketLaunch,
    Sell,
    SignalCellularAlt,
    Storefront,
    EmojiEvents as Tournaments,
} from '@mui/icons-material';
import LoginIcon from '@mui/icons-material/Login';
import SensorOccupiedIcon from '@mui/icons-material/SensorOccupied';
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

function unauthenticatedStartItems(toggleExpansion: (item: string) => void): NavbarItem[] {
    return [
        {
            name: 'Tournaments',
            icon: <Tournaments />,
            onClick: () => toggleExpansion('Tournaments'),
            children: [
                {
                    name: 'DojoLiga',
                    href: '/tournaments/liga',
                },
                {
                    name: 'Open Classical',
                    href: '/tournaments/open-classical',
                },
            ],
        },
        {
            name: 'Material',
            icon: <MenuBook />,
            onClick: () => toggleExpansion('Material'),
            children: [
                {
                    name: 'Courses',
                    icon: <ImportContacts />,
                    href: '/courses',
                },
                {
                    name: 'Books',
                    icon: <AutoStories />,
                    href: '/material/books',
                },
                {
                    name: 'Rating Conversions',
                    icon: <SignalCellularAlt />,
                    href: '/material/ratings',
                },
            ],
        },
        {
            name: 'Blog',
            icon: <Forum />,
            href: '/blog',
        },
        {
            name: 'Shop',
            icon: <Sell />,
            onClick: () => toggleExpansion('Shop'),
            children: [
                {
                    name: 'Courses',
                    icon: <ImportContacts />,
                    href: '/courses',
                },
                {
                    name: 'Coaching',
                    icon: <RocketLaunch />,
                    href: '/coaching',
                },
                {
                    name: 'Merch',
                    icon: <Storefront />,
                    href: 'https://www.chessdojo.shop/shop',
                    target: '_blank',
                },
                {
                    name: 'Donate',
                    href: '/donate',
                    icon: <DonateIcon />,
                },
            ],
        },
        {
            name: 'Contact Us',
            icon: <ContactSupport />,
            href: '/help',
        },
    ];
}

function useNavbarItems(handleClose: () => void) {
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const showAll = useMediaQuery('(min-width:963px)');
    const hide2 = useMediaQuery('(min-width:758px)');
    const hide3 = useMediaQuery('(min-width:665px)');
    const hide4 = useMediaQuery('(min-width:600px)');

    const startItems = unauthenticatedStartItems((item: string) =>
        setOpenItems((v) => ({ ...v, [item]: !(v[item] || false) })),
    );

    let startItemCount = 0;
    if (showAll) {
        startItemCount = startItems.length;
    } else if (hide2) {
        startItemCount = startItems.length - 2;
    } else if (hide3) {
        startItemCount = startItems.length - 3;
    } else if (hide4) {
        startItemCount = startItems.length - 4;
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
                handleClose={handleClose}
            />
        ));

    return {
        startItems: shownStartItems,
        menuItems: menuItems,
    };
}

export const LargeMenuUnauthenticated = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const { startItems, menuItems } = useNavbarItems(handleClose);

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
                <Button href='/signin' sx={{ color: 'white' }}>
                    Sign In
                </Button>
                <Button href='/signup' sx={{ color: 'white' }}>
                    Sign Up
                </Button>
            </Stack>
        </>
    );
};

export const ExtraSmallMenuUnauthenticated = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

    const startItems = unauthenticatedStartItems((item: string) =>
        setOpenItems((v) => ({ ...v, [item]: !(v[item] || false) })),
    );

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
        setOpenItems({});
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
                <MenuItem component='a' href='/signin'>
                    <ListItemIcon>
                        <LoginIcon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Sign In</Typography>
                </MenuItem>
                <MenuItem component='a' href='/signup'>
                    <ListItemIcon>
                        <SensorOccupiedIcon />
                    </ListItemIcon>
                    <Typography textAlign='center'>Sign Up</Typography>
                </MenuItem>

                {startItems.map((item) => [
                    <MenuItem
                        key={item.name}
                        onClick={item.children ? item.onClick : undefined}
                        component={item.href ? 'a' : 'li'}
                        href={item.href}
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
                                        onClick={handleClose}
                                        component={child.href ? 'a' : 'li'}
                                        href={child.href}
                                        target={child.target}
                                        sx={{ pl: 3 }}
                                    >
                                        {child.icon ? (
                                            <ListItemIcon>{child.icon}</ListItemIcon>
                                        ) : (
                                            <ListItemIcon>
                                                <ChevronRight />
                                            </ListItemIcon>
                                        )}
                                        <Typography textAlign='center'>{child.name}</Typography>
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
