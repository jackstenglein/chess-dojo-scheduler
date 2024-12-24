import { render } from '@/test-utils';
import { UrlChip } from './UrlChip';

describe('UrlChip', () => {
    test('renders', () => {
        render(<UrlChip url='http://example.com' />);
    });
});
