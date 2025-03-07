import { Notification, NotificationType, getDescription, getTitle } from '@/database/notification';
import Avatar from '@/profile/Avatar';
import { Stack, Typography } from '@mui/material';

interface NotificationDescriptionProps {
    notification: Notification;
    menuItem?: boolean;
}

const NotificationDescription: React.FC<NotificationDescriptionProps> = (props) => {
    switch (props.notification.type) {
        case NotificationType.NewFollower:
            return <NewFollowerNotificationDescription {...props} />;

        default:
            return <DefaultNotificationDescription {...props} />;
    }
};

const DefaultNotificationDescription: React.FC<NotificationDescriptionProps> = ({
    notification,
    menuItem,
}) => {
    return (
        <Stack>
            <Typography variant='subtitle1' fontWeight='bold' noWrap={menuItem}>
                {getTitle(notification)}
            </Typography>
            <Typography color='text.secondary' noWrap={menuItem}>
                {getDescription(notification)}
            </Typography>
        </Stack>
    );
};

const NewFollowerNotificationDescription: React.FC<NotificationDescriptionProps> = ({
    notification,
    menuItem,
}) => {
    return (
        <Stack>
            <Typography variant='subtitle1' fontWeight='bold' noWrap={menuItem}>
                {getTitle(notification)}
            </Typography>
            <Stack direction='row' spacing={1} alignItems='center'>
                <Avatar
                    username={notification.newFollowerMetadata?.username}
                    displayName={notification.newFollowerMetadata?.displayName}
                    size={44}
                />

                <Stack>
                    <Typography color='text.secondary' noWrap={menuItem}>
                        {notification.newFollowerMetadata?.displayName}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' noWrap={menuItem}>
                        {notification.newFollowerMetadata?.cohort}
                    </Typography>
                </Stack>
            </Stack>
        </Stack>
    );
};

export default NotificationDescription;
