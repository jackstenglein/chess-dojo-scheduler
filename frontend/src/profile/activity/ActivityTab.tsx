import { User } from '@/database/user';
import { Grid2 } from '@mui/material';
import ActivityPieChart from './ActivityPieChart';
import ActivityTimeline from './ActivityTimeline';
import { useTimeline } from './useTimeline';

interface ActivityTabProps {
    user: User;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ user }) => {
    const timeline = useTimeline(user.username);

    return (
        <Grid2 container justifyContent='space-between' rowSpacing={5}>
            <Grid2 size={12}>
                <ActivityPieChart user={user} timeline={timeline} />
            </Grid2>
            <Grid2 size={12}>
                <ActivityTimeline user={user} timeline={timeline} />
            </Grid2>
        </Grid2>
    );
};

export default ActivityTab;
