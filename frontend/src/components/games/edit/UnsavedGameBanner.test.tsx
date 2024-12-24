import { render } from '@/test-utils';
import { UnsavedGameBanner } from './UnsavedGameBanner';

describe('UnsavedGameBanner', () => {
    test('renders', () => {
        render(<UnsavedGameBanner />);
    });
});
