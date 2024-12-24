import { render } from '@/test-utils';
import { NavigationMenu } from './NavigationMenu';

describe('NavigationMenu', () => {
    test('renders', () => {
        render(<NavigationMenu namespace='foo' id='bar' owner='baz' />);
    });
});
