import {
    Button,
    CircularProgress,
    Divider,
    IconButton,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    Notification,
    NotificationType,
    getDescription,
    getTitle,
} from '../database/notification';
import { useNavigate } from 'react-router-dom';
import { useCache } from '../api/cache/Cache';
import { useApi } from '../api/Api';
import { Request, RequestSnackbar, useRequest } from '../api/Request';

interface NotificationListItemProps {
    notification: Notification;
    menuItem?: boolean;
    onClick?: () => void;
}

interface DeletableNotification {
    onDelete: (e: React.MouseEvent) => void;
    deleteRequest: Request;
}

export const NotificationListItem: React.FC<NotificationListItemProps> = ({
    notification,
    onClick,
    menuItem,
}) => {
    const navigate = useNavigate();
    const api = useApi();
    const cache = useCache();
    const request = useRequest();

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
        if (
            notification.type === NotificationType.GameComment &&
            notification.gameCommentMetadata
        ) {
            navigate(
                `/games/${notification.gameCommentMetadata.cohort}/${notification.gameCommentMetadata.id}`
            );
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
                <Stack>
                    <Typography variant='subtitle1' fontWeight='bold'>
                        {getTitle(notification)}
                    </Typography>
                    <Typography color='text.secondary'>
                        {getDescription(notification)}
                    </Typography>
                </Stack>

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
                <Stack direction='row' alignItems='center' spacing={2}>
                    <Stack>
                        <Typography variant='subtitle1' fontWeight='bold' noWrap>
                            {getTitle(notification)}
                        </Typography>
                        <Typography color='text.secondary' noWrap>
                            {getDescription(notification)}
                        </Typography>
                    </Stack>

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
