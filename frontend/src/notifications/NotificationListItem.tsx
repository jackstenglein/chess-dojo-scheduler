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
import { useNavigate } from 'react-router-dom';

import { useApi } from '../api/Api';
import { useCache } from '../api/cache/Cache';
import { Request, RequestSnackbar, useRequest } from '../api/Request';
import { Notification, NotificationType } from '../database/notification';
import NotificationDescription from './NotificationDescription';

interface NotificationListItemProps {
    notification: Notification;
    menuItem?: boolean;
    onClick?: () => void;
}

interface DeletableNotification {
    onDelete: (e: React.MouseEvent) => void;
    deleteRequest: Request<never>;
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({
    notification,
    onClick,
    menuItem,
}) => {
    const navigate = useNavigate();
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

    const onClickNotification = () => {
        switch (notification.type) {
            case NotificationType.GameComment:
                navigate(
                    `/games/${notification.gameCommentMetadata?.cohort}/${notification.gameCommentMetadata?.id}`,
                );
                break;
            case NotificationType.GameReviewComplete:
                navigate(
                    `/games/${notification.gameReviewMetadata?.cohort}/${notification.gameReviewMetadata?.id}`,
                );
                break;

            case NotificationType.NewFollower:
                navigate(`/profile/${notification.newFollowerMetadata?.username}`);
                break;

            case NotificationType.TimelineComment:
            case NotificationType.TimelineReaction:
                navigate(
                    `/newsfeed/${notification.timelineCommentMetadata?.owner}/${notification.timelineCommentMetadata?.id}`,
                );
                break;

            case NotificationType.ExplorerGame:
                navigate(
                    `/games/${notification.explorerGameMetadata?.cohort}/${notification.explorerGameMetadata?.id}`,
                );
                break;

            case NotificationType.NewClubJoinRequest:
                navigate(`/clubs/${notification.clubMetadata?.id}?view=joinRequests`);
                break;

            case NotificationType.ClubJoinRequestApproved:
                navigate(`/clubs/${notification.clubMetadata?.id}`);
                break;
        }

        if (onClick) {
            onClick();
        }
    };

    return (
        <>
            <RequestSnackbar request={request} />
            {menuItem ? (
                <NotificationMenuItem
                    onClick={onClickNotification}
                    notification={notification}
                    onDelete={onDeleteNotification}
                    deleteRequest={request}
                />
            ) : (
                <NotificationItem
                    onClick={onClickNotification}
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
    onClick,
    onDelete,
    deleteRequest,
}) => {
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
                    <Button onClick={onClick}>View</Button>

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
> = ({ notification, onClick, onDelete, deleteRequest }) => {
    return (
        <Stack>
            <MenuItem onClick={onClick}>
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
