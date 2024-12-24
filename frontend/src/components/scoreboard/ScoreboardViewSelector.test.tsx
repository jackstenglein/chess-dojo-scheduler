import { render } from '@/test-utils';
import ScoreboardViewSelector from './ScoreboardViewSelector';

describe('ScoreboardViewSelector', () => {
    test('renders', () => {
        render(<ScoreboardViewSelector value='test' />);
    });
});
