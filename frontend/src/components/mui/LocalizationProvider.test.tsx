import { render } from '@/test-utils';
import { LocalizationProvider } from './LocalizationProvider';

describe('LocalizationProvider', () => {
    test('renders', () => {
        render(
            <LocalizationProvider>
                <></>
            </LocalizationProvider>,
        );
    });
});
