import { AvailabilityType } from './availability';

export enum MeetingStatus {
    Scheduled = 'SCHEDULED',
    Canceled = 'CANCELED',
}

export interface Meeting {
    owner: string;
    participant: string;
    id: string;
    startTime: string;
    type: AvailabilityType;
    location: string;
    description: string;
    status: MeetingStatus;
}
