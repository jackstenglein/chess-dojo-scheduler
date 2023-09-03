import React from 'react';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import AvailabilityViewer from './AvailabilityViewer';
import MeetingViewer from './MeetingViewer';
import GroupViewer from './GroupViewer';
import { Event, EventType } from '../database/event';
import { useAuth } from '../auth/Auth';
import DojoEventViewer from './DojoEventViewer';
import LigaTournamentViewer from './LigaTournamentViewer';

interface ProcessedEventViewerProps {
    processedEvent: ProcessedEvent;
}

const ProcessedEventViewer: React.FC<ProcessedEventViewerProps> = ({
    processedEvent,
}) => {
    const user = useAuth().user!;
    const event: Event | undefined = processedEvent.event;

    if (!event) {
        return null;
    }

    if (event.type === EventType.Availability) {
        if (
            event.participants!.length === 0 ||
            (event.owner !== user.username &&
                event.participants!.every((p) => p.username !== user.username))
        ) {
            return <AvailabilityViewer processedEvent={processedEvent} />;
        }
        if (event.maxParticipants === 1) {
            return <MeetingViewer processedEvent={processedEvent} />;
        }
        return <GroupViewer processedEvent={processedEvent} />;
    } else if (event.type === EventType.Dojo) {
        return <DojoEventViewer processedEvent={processedEvent} />;
    } else if (event.type === EventType.LigaTournament) {
        return <LigaTournamentViewer processedEvent={processedEvent} />;
    }

    return null;
};

export default ProcessedEventViewer;
