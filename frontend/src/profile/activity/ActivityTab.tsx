import { Divider, Grid } from '@mui/material';

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
        <Grid
            container
            flexWrap='wrap-reverse'
            justifyContent='space-between'
            rowSpacing={5}
        >
            <Grid item xs={12} sm={5.5}>
                <ActivityTimeline user={user} timeline={timeline} />
            </Grid>
            <Grid
                item
                sm={1}
                display={{ xs: 'none', sm: 'flex' }}
                justifyContent='center'
            >
                <Divider orientation='vertical' />
            </Grid>
            <Grid item xs={12} sm={5.5}>
                <ActivityPieChart user={user} timeline={timeline} />
            </Grid>
        </Grid>
    );
};

export default ActivityTab;
