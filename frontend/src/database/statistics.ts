import { AvailabilityType } from './availability';

export interface AvailabilityStatistics {
    created: number;
    deleted: number;
    booked: number;
    ownerCohorts: Record<string, number>;
    deleterCohorts: Record<string, number>;
    bookableCohorts: Record<string, number>;
    groupCohorts: Record<string, number>;
    types: Record<AvailabilityType, number>;
}

export interface MeetingStatistics {
    created: number;
    canceled: number;
    ownerCohorts: Record<string, number>;
    participantCohorts: Record<string, number>;
    cancelerCohorts: Record<string, number>;
    groupCohorts: Record<string, number>;
    types: Record<AvailabilityType, number>;
}
