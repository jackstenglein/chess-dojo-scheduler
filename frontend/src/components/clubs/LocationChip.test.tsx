import { render } from '@/test-utils';
import { LocationChip } from './LocationChip';

describe('LocationChip', () => {
    test('renders', () => {
        const loc = { city: 'Boston', state: 'Massachusetts', country: 'USA' };
        render(<LocationChip location={loc} />);
    });
});
