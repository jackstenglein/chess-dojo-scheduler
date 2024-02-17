import { CardContent, Stack } from '@mui/material';
import { Game } from '../../../../../database/game';
import EditorSettings from './EditorSettings';
import ViewerSettings from './ViewerSettings';

interface SettingsProps {
    showEditor?: boolean;
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

const Settings: React.FC<SettingsProps> = ({ showEditor, game, onSaveGame }) => {
    return (
        <CardContent>
            <Stack spacing={6}>
                {showEditor && game && (
                    <EditorSettings game={game} onSaveGame={onSaveGame} />
                )}
                <ViewerSettings showTitle={Boolean(showEditor && game)} />
            </Stack>
        </CardContent>
    );
};

export default Settings;
