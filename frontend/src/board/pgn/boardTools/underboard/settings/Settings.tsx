import { CardContent, Stack } from '@mui/material';
import { useAuth } from '../../../../../auth/Auth';
import { Game } from '../../../../../database/game';
import AdminSettings from './AdminSettings';
import EditorSettings from './EditorSettings';
import ViewerSettings from './ViewerSettings';

interface SettingsProps {
    showEditor?: boolean;
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

const Settings: React.FC<SettingsProps> = ({ showEditor, game, onSaveGame }) => {
    const viewer = useAuth().user;

    return (
        <CardContent>
            <Stack spacing={6}>
                {showEditor && game && (
                    <EditorSettings game={game} onSaveGame={onSaveGame} />
                )}
                {viewer?.isAdmin && game && (
                    <AdminSettings game={game} onSaveGame={onSaveGame} />
                )}
                <ViewerSettings
                    showTitle={Boolean(game && (showEditor || viewer?.isAdmin))}
                />
            </Stack>
        </CardContent>
    );
};

export default Settings;
