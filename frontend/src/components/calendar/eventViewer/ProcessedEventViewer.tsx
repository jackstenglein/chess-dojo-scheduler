import { useAuth } from '@/auth/Auth';
import { Event, EventType } from '@/database/event';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';
import React from 'react';
import AvailabilityViewer from './AvailabilityViewer';
import CoachingViewer from './CoachingViewer';
import DojoEventViewer from './DojoEventViewer';
import LigaTournamentViewer from './LigaTournamentViewer';
import MeetingViewer from './MeetingViewer';

interface ProcessedEventViewerProps {
    processedEvent: ProcessedEvent;
}

const ProcessedEventViewer: React.FC<ProcessedEventViewerProps> = ({
    processedEvent,
}) => {
    const { user } = useAuth();
    const event = processedEvent.event as Event | undefined;

    console.log('Processed Event: ', processedEvent);

    if (!event) {
        return null;
    }

    if (event.type === EventType.Availability) {
        if (
            Object.values(event.participants).length === 0 ||
            (event.owner !== user?.username && !event.participants[user?.username || ''])
        ) {
            return <AvailabilityViewer processedEvent={processedEvent} />;
        }
        return <MeetingViewer processedEvent={processedEvent} />;
    } else if (event.type === EventType.Dojo) {
        return <DojoEventViewer processedEvent={processedEvent} />;
    } else if (event.type === EventType.LigaTournament) {
        return <LigaTournamentViewer processedEvent={processedEvent} />;
    } else if (event.type === EventType.Coaching) {
        return <CoachingViewer processedEvent={processedEvent} />;
    }

    return null;
};

export default ProcessedEventViewer;
