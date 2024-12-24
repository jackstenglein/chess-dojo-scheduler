import { render } from '@/test-utils';
import { MemberCountChip } from './MemberCountChip';

describe('MemberCountChip', () => {
    test('renders', () => {
        render(<MemberCountChip count={3} />);
    });
});
