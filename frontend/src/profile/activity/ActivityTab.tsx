import { Divider, Grid } from '@mui/material';

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
            flexWrap='wrap-reverse'
            justifyContent='space-between'
            rowSpacing={5}
        >
            <Grid item xs={12} sm={5.5}>
                <ActivityTimeline user={user} />
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
                <ActivityPieChart user={user} />
            </Grid>
        </Grid>
    );
};

export default ActivityTab;
