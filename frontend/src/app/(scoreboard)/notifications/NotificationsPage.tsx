'use client';

import { useNotifications } from '@/api/cache/Cache';
import { NotificationListItem } from '@/components/notifications/NotificationListItem';
import LoadingPage from '@/loading/LoadingPage';
import { Container, Stack, Typography } from '@mui/material';

export function NotificationsPage() {
    const { notifications, request } = useNotifications();

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

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
}
