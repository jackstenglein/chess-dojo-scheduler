import { render } from '@/test-utils';
import ProcessedEventViewer from './ProcessedEventViewer';

describe('ProcessedEventViewer', () => {
    test('renders', () => {
        const event = {
            event_id: '9b0c61f2-1f00-4f4c-be7c-49876906d020',
            title: 'test',
            start: new Date('2023-09-16T09:00:00.000Z'),
            end: new Date('2023-09-16T13:00:00.000Z'),
        };
        render(<ProcessedEventViewer processedEvent={event} />);
    });
});
