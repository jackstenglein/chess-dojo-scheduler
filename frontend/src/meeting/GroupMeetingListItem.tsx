import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardContent, CardHeader, Typography } from '@mui/material';

import { Event } from '../database/event';
import { toDojoTimeString } from '../calendar/displayDate';
import { useAuth } from '../auth/Auth';

interface GroupMeetingListItemProps {
    availability: Event;
}

const GroupMeetingListItem: React.FC<GroupMeetingListItemProps> = ({ availability }) => {
    const navigate = useNavigate();
    const timeFormat = useAuth().user?.timeFormat;

    const onClick = () => {
        navigate('/group/' + availability.id);
    };

    const start = new Date(availability.startTime);

    return (
        <Card variant='outlined' sx={{ width: 1 }}>
            <CardActionArea onClick={onClick}>
                <CardHeader
                    title={'Group Meeting'}
                    subheader={`${start.toLocaleDateString()} • ${toDojoTimeString(
                        start,
                        timeFormat
                    )}`}
                    sx={{ pb: 0 }}
                />
                <CardContent sx={{ pt: 0, mt: 0 }}>
                    <Typography variant='subtitle1' color='text.secondary'>
                        {Object.values(availability.participants).length + 1} participants
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default GroupMeetingListItem;
