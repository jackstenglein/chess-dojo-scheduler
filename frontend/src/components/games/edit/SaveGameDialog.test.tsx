import { render } from '@/test-utils';
import SaveGameDialog, { SaveGameDialogType, SaveGameForm } from './SaveGameDialog';

describe('SaveGameDialog', () => {
    test('renders', () => {
        const onSubmit = async (_: SaveGameForm) => {
            // do nothing
        };
        const onClose = () => {
            // Do nothing
        };

        render(
            <SaveGameDialog
                type={SaveGameDialogType.Save}
                title='Save Analysis'
                open={true}
                loading={false}
                onSubmit={onSubmit}
                onClose={onClose}
            />,
        );
    });
});
