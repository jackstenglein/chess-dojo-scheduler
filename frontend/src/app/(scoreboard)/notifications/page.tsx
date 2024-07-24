import { Container, Stack, Typography } from '@mui/material';
import { useNotifications } from '../api/cache/Cache';
import { NotificationListItem } from './NotificationListItem';

const NotificationPage = () => {
    const { notifications } = useNotifications();

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant='h4'>Notifications</Typography>

            <Stack pt={3} spacing={2}>
                {notifications.map((n) => (
                    <NotificationListItem key={n.id} notification={n} />
                ))}
                {notifications.length === 0 && <Typography>No notifications</Typography>}
            </Stack>
        </Container>
    );
};

export default NotificationPage;
