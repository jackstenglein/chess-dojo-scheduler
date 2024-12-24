import { ExamType } from '@/database/exam';
import { render } from '@/test-utils';
import { ExamList } from './ExamList';

describe('ExamList', () => {
    test('renders', () => {
        render(<ExamList examType={ExamType.Tactics} cohortRanges={[]} />);
    });
});
