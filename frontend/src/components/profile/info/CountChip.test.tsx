import { render } from '@/test-utils';
import CountChip from './CountChip';

describe('CountChip', () => {
    test('renders', () => {
        render(<CountChip count={3} label='test chip' link='http://example.com/' />);
    });
});
