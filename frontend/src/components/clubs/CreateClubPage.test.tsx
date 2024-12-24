import { render } from '@/test-utils';
import { CreateClubPage } from './CreateClubPage';

describe('CreateClubPage', () => {
    test('renders', () => {
        render(<CreateClubPage id='bogus-id' />);
    });
});
