'use client';

import { useNotifications } from '@/api/cache/Cache';
import GameTable from '@/components/games/list/GameTable';
import { GameInfo } from '@/database/game';
import { NotificationType } from '@/database/notification';
import { useRouter } from '@/hooks/useRouter';
import LoadingPage from '@/loading/LoadingPage';
import { Container } from '@mui/material';

export function NotificationPage({ id }: { id: string }) {
    const { notifications, request } = useNotifications();
    const router = useRouter();

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.type !== NotificationType.ExplorerGame) {
        router.push('/notifications');
        return null;
    }

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <GameTable
                namespace='notifications'
                pagination={{
                    data:
                        (notification.explorerGameMetadata as unknown as GameInfo[]) ??
                        [],
                    request,
                    page: 0,
                    pageSize: notification.explorerGameMetadata?.length ?? 0,
                    rowCount: notification.explorerGameMetadata?.length ?? 0,
                    hasMore: false,
                    setPage: noop,
                    setPageSize: noop,
                    setGames: noop,
                    onSearch: noop,
                    onDelete: noop,
                }}
            />
        </Container>
    );
}

function noop() {
    return null;
}
