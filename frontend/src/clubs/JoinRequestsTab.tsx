import {
    CircularProgress,
    Divider,
    IconButton,
    Link,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Block, Check } from '@mui/icons-material';

import { useAuth } from '../auth/Auth';
import { ClubDetails, ClubJoinRequest, ClubJoinRequestStatus } from '../database/club';
import Avatar from '../profile/Avatar';
import { toDojoDateString, toDojoTimeString } from '../calendar/displayDate';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';

interface JoinRequestsTabProps {
    club: ClubDetails;
    onProcessRequest: (club: ClubDetails, snackbarText: string) => void;
}

const JoinRequestsTab: React.FC<JoinRequestsTabProps> = ({ club, onProcessRequest }) => {
    const viewer = useAuth().user;
    if (viewer?.username !== club.owner) {
        return null;
    }

    const pendingRequests = Object.values(club.joinRequests)
        .filter((joinRequest) => joinRequest.status !== ClubJoinRequestStatus.Rejected)
        .sort((lhs, rhs) => rhs.createdAt.localeCompare(lhs.createdAt));

    const rejectedRequests = Object.values(club.joinRequests)
        .filter((joinRequest) => joinRequest.status === ClubJoinRequestStatus.Rejected)
        .sort((lhs, rhs) => rhs.createdAt.localeCompare(lhs.createdAt));

    return (
        <Stack spacing={7}>
            <Stack spacing={3}>
                <Typography variant='h5'>Pending Requests</Typography>
                {pendingRequests.map((joinRequest, idx) => (
                    <JoinRequest
                        key={joinRequest.username}
                        clubId={club.id}
                        joinRequest={joinRequest}
                        divider={idx + 1 < pendingRequests.length}
                        onProcessRequest={onProcessRequest}
                    />
                ))}
                {pendingRequests.length === 0 && (
                    <Typography>No pending requests</Typography>
                )}
            </Stack>

            <Stack spacing={3}>
                <Typography variant='h5'>Rejected Requests</Typography>
                {rejectedRequests.map((joinRequest, idx) => (
                    <JoinRequest
                        key={joinRequest.username}
                        clubId={club.id}
                        joinRequest={joinRequest}
                        divider={idx + 1 < rejectedRequests.length}
                        onProcessRequest={onProcessRequest}
                    />
                ))}
                {rejectedRequests.length === 0 && (
                    <Typography>No rejected requests</Typography>
                )}
            </Stack>
        </Stack>
    );
};

interface JoinRequestProps {
    clubId: string;
    joinRequest: ClubJoinRequest;
    divider: boolean;
    onProcessRequest: (club: ClubDetails, snackbarText: string) => void;
}

const JoinRequest: React.FC<JoinRequestProps> = ({
    clubId,
    joinRequest,
    divider,
    onProcessRequest,
}) => {
    const viewer = useAuth().user;
    const api = useApi();
    const request = useRequest();

    const date = new Date(joinRequest.createdAt);
    const dateStr = toDojoDateString(date, viewer?.timezoneOverride);
    const timeStr = toDojoTimeString(date, viewer?.timezoneOverride, viewer?.timeFormat);

    const handleRequest = (status: ClubJoinRequestStatus) => {
        request.onStart();
        api.processJoinRequest(clubId, joinRequest.username, status)
            .then((resp) => {
                console.log('processJoinRequest: ', resp);
                if (status === ClubJoinRequestStatus.Approved) {
                    onProcessRequest(
                        resp.data,
                        `${joinRequest.displayName} added as a club member`
                    );
                } else if (status === ClubJoinRequestStatus.Rejected) {
                    onProcessRequest(resp.data, 'Join request rejected');
                }
            })
            .catch((err) => {
                console.error('processJoinRequest: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Stack spacing={2}>
            <RequestSnackbar request={request} />

            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                flexWrap='wrap'
                rowGap={2}
            >
                <Stack direction='row' spacing={2} alignItems='center'>
                    <Avatar
                        username={joinRequest.username}
                        displayName={joinRequest.displayName}
                        size={68}
                    />

                    <Stack>
                        <Link
                            component={RouterLink}
                            to={`/profile/${joinRequest.username}`}
                        >
                            {joinRequest.displayName}
                        </Link>
                        <Typography color='text.secondary'>
                            {joinRequest.cohort}
                        </Typography>
                        <Typography color='text.secondary' variant='body2'>
                            {dateStr} • {timeStr}
                        </Typography>
                    </Stack>
                </Stack>

                <Stack direction='row' spacing={1} alignItems='center'>
                    {request.isLoading() ? (
                        <CircularProgress />
                    ) : (
                        <>
                            <Tooltip title='Approve Request'>
                                <IconButton>
                                    <Check
                                        color='success'
                                        onClick={() =>
                                            handleRequest(ClubJoinRequestStatus.Approved)
                                        }
                                    />
                                </IconButton>
                            </Tooltip>

                            {joinRequest.status !== ClubJoinRequestStatus.Rejected && (
                                <Tooltip title='Reject Request'>
                                    <IconButton>
                                        <Block
                                            color='error'
                                            onClick={() =>
                                                handleRequest(
                                                    ClubJoinRequestStatus.Rejected
                                                )
                                            }
                                        />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </>
                    )}
                </Stack>
            </Stack>

            <Typography whiteSpace='pre-line'>{joinRequest.notes}</Typography>

            {divider && <Divider />}
        </Stack>
    );
};

export default JoinRequestsTab;
