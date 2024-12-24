import { render } from '@/test-utils';
import Percentiles from './Percentiles';

describe('Percentiles', () => {
    test('renders', () => {
        render(
            <Percentiles
                description=''
                cohort='700-800'
                percentile={85}
                cohortPercentile={90}
            />,
        );
    });
});
