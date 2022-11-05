import { AvailabilityType } from './availability';

export interface Meeting {
    owner: string;
    participant: string;
    id: string;
    startTime: string;
    type: AvailabilityType;
    location: string;
    description: string;
}
