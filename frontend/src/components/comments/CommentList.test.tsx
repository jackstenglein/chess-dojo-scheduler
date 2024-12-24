import { render } from '@/test-utils';
import CommentList from './CommentList';

describe('CommentList', () => {
    test('renders', () => {
        render(<CommentList comments={[]} />);
    });
});
