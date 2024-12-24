import { render } from '@/test-utils';
import NewsfeedList from './NewsfeedList';

describe('NewsfeedList', () => {
    test('renders', () => {
        render(<NewsfeedList initialNewsfeedIds={[]} />);
    });
});
