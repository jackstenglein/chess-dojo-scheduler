'use client';

import { useApi } from '@/api/Api';
import { Request, RequestSnackbar, useRequest } from '@/api/Request';
import { useCache } from '@/api/cache/Cache';
import { Notification, NotificationType } from '@/database/notification';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Button,
    CircularProgress,
    Divider,
    IconButton,
    MenuItem,
    Stack,
    Tooltip,
} from '@mui/material';
import NotificationDescription from './NotificationDescription';

interface NotificationListItemProps {
    notification: Notification;
    menuItem?: boolean;
}

interface DeletableNotification {
    onDelete: (e: React.MouseEvent) => void;
    deleteRequest: Request<never>;
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({
    notification,
    menuItem,
}) => {
    const api = useApi();
    const cache = useCache();
    const request = useRequest<never>();

    const onDeleteNotification = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        request.onStart();
        api.deleteNotification(notification.id)
            .then(() => {
                cache.notifications.remove(notification.id);
                request.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <RequestSnackbar request={request} />
            {menuItem ? (
                <NotificationMenuItem
                    notification={notification}
                    onDelete={onDeleteNotification}
                    deleteRequest={request}
                />
            ) : (
                <NotificationItem
                    onDelete={onDeleteNotification}
                    notification={notification}
                    deleteRequest={request}
                />
            )}
        </>
    );
};

const NotificationItem: React.FC<NotificationListItemProps & DeletableNotification> = ({
    notification,
    onDelete,
    deleteRequest,
}) => {
    const href = getLink(notification);
    return (
        <Stack spacing={1}>
            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                spacing={1}
                width={1}
            >
                <NotificationDescription notification={notification} menuItem />

                <Stack direction='row' spacing={2}>
                    <Button href={href}>View</Button>

                    {deleteRequest.isLoading() ? (
                        <CircularProgress />
                    ) : (
                        <Tooltip title='Delete notification'>
                            <IconButton onClick={onDelete}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Stack>

            <Divider />
        </Stack>
    );
};

const NotificationMenuItem: React.FC<
    NotificationListItemProps & DeletableNotification
> = ({ notification, onDelete, deleteRequest }) => {
    const href = getLink(notification);
    return (
        <Stack>
            <MenuItem component='a' href={href}>
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    spacing={2}
                    width={1}
                >
                    <NotificationDescription notification={notification} menuItem />

                    {deleteRequest.isLoading() ? (
                        <CircularProgress />
                    ) : (
                        <Tooltip title='Delete notification'>
                            <IconButton onClick={onDelete}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </MenuItem>
            <Divider />
        </Stack>
    );
};

function getLink(notification: Notification): string {
    switch (notification.type) {
        case NotificationType.GameComment:
        case NotificationType.GameCommentReply:
            return `/games/${notification.gameCommentMetadata?.cohort}/${notification.gameCommentMetadata?.id}`;
        case NotificationType.GameReviewComplete:
            return `/games/${notification.gameReviewMetadata?.cohort}/${notification.gameReviewMetadata?.id}`;

        case NotificationType.NewFollower:
            return `/profile/${notification.newFollowerMetadata?.username}`;

        case NotificationType.TimelineComment:
        case NotificationType.TimelineReaction:
            return `/newsfeed/${notification.timelineCommentMetadata?.owner}/${notification.timelineCommentMetadata?.id}`;

        case NotificationType.ExplorerGame:
            if (notification.count === 1)
                return `/games/${notification.explorerGameMetadata?.[0].cohort}/${notification.explorerGameMetadata?.[0].id}`;
            return `/notifications/${encodeURIComponent(notification.id)}`;

        case NotificationType.NewClubJoinRequest:
            return `/clubs/${notification.clubMetadata?.id}?view=joinRequests`;

        case NotificationType.ClubJoinRequestApproved:
            return `/clubs/${notification.clubMetadata?.id}`;
    }
}
