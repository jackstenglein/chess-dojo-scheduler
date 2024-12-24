import { render } from '@/test-utils';
import { AuthContainer } from './AuthContainer';

describe('AuthContainer', () => {
    test('renders', () => {
        render(
            <AuthContainer>
                <></>
            </AuthContainer>,
        );
    });
});
