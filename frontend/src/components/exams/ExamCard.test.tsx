import { QueenIcon } from '@/style/ChessIcons';
import { render } from '@/test-utils';
import { ExamCard } from './ExamCard';

describe('ExamCard', () => {
    test('renders', () => {
        render(
            <ExamCard
                name='Tactics Test'
                description='All Ratings'
                href='/tests/tactics'
                icon={QueenIcon}
            />,
        );
    });
});
