import { CalendarToday, FormatListBulleted } from '@mui/icons-material';
import {
    Divider,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { useCallback } from 'react';

import Bio from '@/components/profile/info/Bio';
import { displayEvent } from '../../app/(scoreboard)/coaching/CoachingList';
import UpcomingSessions from '../../app/(scoreboard)/coaching/UpcomingSessions';
import { Event } from '../../database/event';
import { User } from '../../database/user';

interface CoachTabProps {
    user: User;
}

const CoachTab: React.FC<CoachTabProps> = ({ user }) => {
    const filterFunction = useCallback(
        (e: Event, viewer?: User) => e.owner === user.username && displayEvent(e, viewer),
        [user],
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
