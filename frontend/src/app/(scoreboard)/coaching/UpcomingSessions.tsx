'use client';

import { useEvents } from '@/api/cache/Cache';
import { useAuth } from '@/auth/Auth';
import { Event } from '@/database/event';
import { User } from '@/database/user';
import { CalendarToday, FormatListBulleted } from '@mui/icons-material';
import { Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import CoachingCalendar from './CoachingCalendar';
import CoachingList, { displayEvent } from './CoachingList';

interface UpcomingSessionsProps {
    header?: (
        view: string,
        onChangeView: (_: React.MouseEvent<HTMLElement>, newValue: string | null) => void,
    ) => JSX.Element & React.ReactNode;
    filterFunction?: (e: Event, u?: User) => boolean;
}

const UpcomingSessions: React.FC<UpcomingSessionsProps> = ({ header, filterFunction }) => {
    const viewer = useAuth().user;
    const { events, putEvent, removeEvent, request } = useEvents();

    const predicate = filterFunction || displayEvent;
    const coachingEvents = useMemo(
        () =>
            events
                .filter((e) => predicate(e, viewer))
                .sort((lhs, rhs) => lhs.startTime.localeCompare(rhs.startTime)),
        [events, viewer, predicate],
    );
    const [view, setView] = useState('list');

    const onChangeView = (_: React.MouseEvent<HTMLElement>, newValue: string | null) => {
        if (newValue) {
            setView(newValue);
        }
    };

    return (
        <Stack spacing={2}>
            {header ? (
                header(view, onChangeView)
            ) : (
                <ToggleButtonGroup exclusive value={view} onChange={onChangeView} size='small'>
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
            )}

            {coachingEvents.length === 0 ? (
                <Stack alignItems='center'>
                    <Typography>No available sessions found for your cohort</Typography>
                </Stack>
            ) : view === 'list' ? (
                <CoachingList events={coachingEvents} request={request} />
            ) : (
                <CoachingCalendar
                    events={coachingEvents}
                    putEvent={putEvent}
                    removeEvent={removeEvent}
                    request={request}
                />
            )}
        </Stack>
    );
};

export default UpcomingSessions;
