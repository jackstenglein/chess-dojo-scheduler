import { AvailabilityStatus, AvailabilityType, Participant } from './availability';

export enum EventType {
    Availability = 'AVAILABILITY',
    Dojo = 'DOJO',
}

export interface Event {
    id: string;
    type: EventType;
    owner: string;
    ownerDisplayName: string;
    ownerCohort: string;
    ownerPreviousCohort: string;
    title: string;
    startTime: string;
    endTime: string;
    bookedStartTime: string;
    types: AvailabilityType[];
    bookedType: AvailabilityType;
    cohorts: string[];
    status: AvailabilityStatus;
    location: string;
    description: string;
    maxParticipants: number;
    participants: Participant[];
    discordMessageId: string;
    discordEventIds: string[];
}
