import { render } from '@/test-utils';
import GraduationSection from './GraduationSection';

describe('GraduationSection', () => {
    test('renders', () => {
        const review = {
            username: 'foo',
            period: 'bar',
            currentCohort: '700-800',
            displayName: 'foo',
            userJoinedAt: '2020-12-22',
            total: {
                dojoPoints: {
                    total: {
                        value: 5000,
                        percentile: 85,
                        cohortPercentile: 90,
                    },
                },
                minutesSpent: {
                    total: {
                        value: 7200,
                        percentile: 75,
                        cohortPercentile: 80,
                    },
                },
                games: {
                    total: {
                        value: 300,
                        percentile: 70,
                        cohortPercentile: 75,
                    },
                },
            },
        };

        render(<GraduationSection review={review} />);
    });
});
