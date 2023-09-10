import { Grid } from '@mui/material';

import { User } from '../../database/user';
import ActivityTimeline from './ActivityTimeline';
import ActivityPieChart from './ActivityPieChart';
import { useTimeline } from './useTimeline';

interface ActivityTabProps {
    user: User;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ user }) => {
    const timeline = useTimeline(user.username);

    return (
        <Grid container justifyContent='space-between' rowSpacing={5}>
            <Grid item xs={12}>
                <ActivityPieChart user={user} timeline={timeline} />
            </Grid>
            <Grid item xs={12}>
                <ActivityTimeline user={user} timeline={timeline} />
            </Grid>
        </Grid>
    );
};

export default ActivityTab;
