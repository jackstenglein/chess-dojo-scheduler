import React from 'react';
import { ProcessedEvent } from '@aldabil/react-scheduler/types';

import AvailabilityViewer from './AvailabilityViewer';
import MeetingViewer from './MeetingViewer';
import GroupViewer from './GroupViewer';

interface ProcessedEventViewerProps {
    event: ProcessedEvent;
}

const ProcessedEventViewer: React.FC<ProcessedEventViewerProps> = ({ event }) => {
    if (event.availability) {
        return <AvailabilityViewer event={event} />;
    }

    if (event.meeting) {
        return <MeetingViewer event={event} />;
    }

    if (event.group) {
        return <GroupViewer event={event} />;
    }

    return null;
};

export default ProcessedEventViewer;
