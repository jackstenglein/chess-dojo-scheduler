import { render } from '@/test-utils';
import GraduationLinkCardGrid from './GraduationLinkCardGrid';

describe('GraduationLinkCardGrid', () => {
    test('renders', () => {
        render(<GraduationLinkCardGrid graduations={[]} />);
    });
});
