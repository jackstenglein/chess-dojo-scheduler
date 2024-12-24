import { render } from '@/test-utils';
import FollowersList from './FollowersList';

describe('FollowersList', () => {
    test('renders', () => {
        render(<FollowersList username='bestieboots' type='following' />);
    });
});
