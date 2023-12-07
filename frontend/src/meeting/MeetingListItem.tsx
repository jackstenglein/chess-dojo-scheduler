import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    Chip,
    Typography,
    Link,
    Stack,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { Event, AvailabilityStatus, getDisplayString } from '../database/event';
import { useAuth } from '../auth/Auth';
import React from 'react';
import Avatar from '../profile/Avatar';
import { toDojoDateString, toDojoTimeString } from '../calendar/displayDate';

interface MeetingListItemProps {
    meeting: Event;
}

const MeetingListItem: React.FC<MeetingListItemProps> = ({ meeting }) => {
    const user = useAuth().user!;
    const navigate = useNavigate();

    const onClick = () => {
        navigate('/meeting/' + meeting.id);
    };

    const start = new Date(meeting.bookedStartTime || meeting.startTime);

    let opponent = Object.values(meeting.participants)[0];
    if (opponent.username === user.username) {
        opponent = {
            username: meeting.owner,
            displayName: meeting.ownerDisplayName,
            cohort: meeting.ownerCohort,
            previousCohort: meeting.ownerPreviousCohort,
        };
    }

    const onClickOpponent = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/profile/${opponent.username}`);
    };

    return (
        <Card variant='outlined' sx={{ width: 1 }}>
            <CardActionArea onClick={onClick}>
                <CardHeader
                    title={getDisplayString(meeting.bookedType)}
                    subheader={`${toDojoDateString(
                        start,
                        user.timezoneOverride
                    )} • ${toDojoTimeString(
                        start,
                        user.timezoneOverride,
                        user.timeFormat
                    )}`}
                    sx={{ pb: 0 }}
                />
                <CardContent sx={{ pt: 0, mt: 1 }}>
                    {meeting.status === AvailabilityStatus.Canceled && (
                        <Chip
                            color='error'
                            label='Canceled'
                            icon={<ErrorOutlineIcon />}
                        />
                    )}

                    <Stack direction='row' spacing={1} alignItems='center'>
                        <Avatar
                            username={opponent.username}
                            displayName={opponent.displayName}
                            size={25}
                        />
                        <Link
                            component={RouterLink}
                            to={`/profile/${opponent.username}`}
                            onClick={onClickOpponent}
                        >
                            <Typography variant='subtitle1'>
                                {opponent.displayName} ({opponent.cohort})
                            </Typography>
                        </Link>
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default MeetingListItem;
