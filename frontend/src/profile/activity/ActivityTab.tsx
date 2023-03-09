import { Grid } from '@mui/material';

import { User } from '../../database/user';
import ActivityTimeline from './ActivityTimeline';
import ActivityPieChart from './ActivityPieChart';

interface ActivityTabProps {
    user: User;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ user }) => {
    return (
        <Grid
            container
            spacing={2}
            flexWrap='wrap-reverse'
            justifyContent='space-between'
        >
            <Grid item xs={12} sm={6}>
                <ActivityTimeline user={user} />
            </Grid>
            <Grid item xs={12} sm={6}>
                <ActivityPieChart user={user} />
            </Grid>
        </Grid>
    );
};

export default ActivityTab;
