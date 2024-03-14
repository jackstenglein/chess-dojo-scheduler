import { CardContent, Stack } from '@mui/material';
import { useAuth } from '../../../../../auth/Auth';
import { Game } from '../../../../../database/game';
import AdminSettings from './AdminSettings';
import EditorSettings from './EditorSettings';
import GameSettings from './GameSettings';
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
                    <GameSettings game={game} onSaveGame={onSaveGame} />
                )}
                {viewer?.isAdmin && game && (
                    <AdminSettings game={game} onSaveGame={onSaveGame} />
                )}
                <EditorSettings />
                <ViewerSettings />
            </Stack>
        </CardContent>
    );
};

export default Settings;
