import { AvailabilityType, EventStatus, EventType } from '@/database/event';
import { render } from '@/test-utils';
import CoachingBooker from './CoachingBooker';

describe('CoachingBooker', () => {
    test('renders', () => {
        const event = {
            id: 'foo',
            type: EventType.Coaching,
            owner: 'Sensei',
            ownerDisplayName: 'Sensei',
            ownerCohort: '',
            ownerPreviousCohort: '',
            title: 'Coaching',
            startTime: '2023-09-16T17:00:00+00:00',
            endTime: '2023-09-16T18:00:00+00:00',
            bookedStartTime: '',
            bookedType: AvailabilityType.BookStudy,
            cohorts: [],
            status: EventStatus.Booked,
            location: 'https://lichess.org/swiss/TH81BIsW',
            description: '',
            maxParticipants: 0,
            participants: {},
            discordMessageId: '',
            privateDiscordEventId: '',
            hideFromPublicDiscord: true,
            publicDiscordEventId: '',
        };

        render(<CoachingBooker event={event} />);
    });
});
