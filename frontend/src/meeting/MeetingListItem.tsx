import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardContent, CardHeader, Chip } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { Event } from '../database/event';
import { AvailabilityStatus, getDisplayString } from '../database/availability';

interface MeetingListItemProps {
    meeting: Event;
}

const MeetingListItem: React.FC<MeetingListItemProps> = ({ meeting }) => {
    const navigate = useNavigate();

    const onClick = () => {
        navigate('/meeting/' + meeting.id);
    };

    const start = new Date(meeting.bookedStartTime || meeting.startTime);

    return (
        <Card variant='outlined' sx={{ width: 1 }}>
            <CardActionArea onClick={onClick}>
                <CardHeader
                    title={getDisplayString(meeting.bookedType)}
                    subheader={`${start.toLocaleDateString()} • ${start.toLocaleTimeString()}`}
                />
                {meeting.status === AvailabilityStatus.Canceled && (
                    <CardContent sx={{ pt: 0 }}>
                        <Chip
                            color='error'
                            label='Canceled'
                            icon={<ErrorOutlineIcon />}
                        />
                    </CardContent>
                )}
            </CardActionArea>
        </Card>
    );
};

export default MeetingListItem;
