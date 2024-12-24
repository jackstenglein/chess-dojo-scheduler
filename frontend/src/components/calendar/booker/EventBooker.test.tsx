import { render } from '@/test-utils';
import EventBooker from './EventBooker';

describe('EventBooker', () => {
    test('renders', () => {
        render(<EventBooker id='bogus-id' />);
    });
});
