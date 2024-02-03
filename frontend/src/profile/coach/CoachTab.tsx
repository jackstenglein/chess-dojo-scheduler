import { useCallback } from 'react';
import {
    Divider,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { CalendarToday, FormatListBulleted } from '@mui/icons-material';

import { User } from '../../database/user';
import Bio from '../info/Bio';
import { displayEvent } from '../../coaching/customers/CoachingList';
import UpcomingSessions from '../../coaching/customers/UpcomingSessions';
import { Event } from '../../database/event';

interface CoachTabProps {
    user: User;
}

const CoachTab: React.FC<CoachTabProps> = ({ user }) => {
    const filterFunction = useCallback(
        (e: Event, viewer?: User) => e.owner === user.username && displayEvent(e, viewer),
        [user]
    );

    if (!user.isCoach) {
        return null;
    }

    return (
        <Stack spacing={5}>
            <Bio bio={user.coachBio} />

            <UpcomingSessions
                filterFunction={filterFunction}
                header={(view, onChangeView) => (
                    <Stack>
                        <Stack
                            direction='row'
                            justifyContent='space-between'
                            alignItems='center'
                        >
                            <Typography variant='h6'>Upcoming Sessions</Typography>
                            <ToggleButtonGroup
                                exclusive
                                value={view}
                                onChange={onChangeView}
                                size='small'
                            >
                                <ToggleButton value='list'>
                                    <Tooltip title='View as list'>
                                        <FormatListBulleted />
                                    </Tooltip>
                                </ToggleButton>

                                <ToggleButton value='calendar'>
                                    <Tooltip title='View in calendar'>
                                        <CalendarToday />
                                    </Tooltip>
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Stack>
                        <Divider />
                    </Stack>
                )}
            />
        </Stack>
    );
};

export default CoachTab;
