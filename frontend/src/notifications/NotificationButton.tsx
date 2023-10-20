import { Badge, IconButton, Menu, MenuItem, MenuList, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useState } from 'react';

import { useNotifications } from '../api/cache/Cache';
import { NotificationListItem } from './NotificationListItem';

const NotificationButton = () => {
    const { notifications } = useNotifications();

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Tooltip title='Notifications'>
                <IconButton
                    data-cy='Notifications'
                    onClick={handleOpen}
                    sx={{ color: 'white' }}
                >
                    <Badge
                        badgeContent={notifications.length}
                        color='secondary'
                        overlap='circular'
                    >
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>
            <Menu
                id='notifications-menu'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <MenuList>
                    {notifications.map((n) => (
                        <NotificationListItem
                            key={n.id}
                            notification={n}
                            onClick={handleClose}
                            menuItem
                        />
                    ))}
                    {notifications.length === 0 && (
                        <MenuItem onClick={handleClose}>No notifications</MenuItem>
                    )}
                </MenuList>
            </Menu>
        </>
    );
};

export default NotificationButton;
