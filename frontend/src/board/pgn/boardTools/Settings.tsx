import {
    Button,
    CardContent,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
} from '@mui/material';
import DeleteGameButton from '../../../games/view/DeleteGameButton';
import { Game } from '../../../database/game';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface SettingsProps {
    game: Game;
}

const Settings: React.FC<SettingsProps> = ({ game }) => {
    const [visibility, setVisibility] = useState(game.unlisted ? 'unlisted' : 'public');
    const [orientation, setOrientation] = useState<string>(game.orientation || 'white');
    const navigate = useNavigate();

    const saveDisabled =
        (visibility === 'unlisted') === game.unlisted && orientation === game.orientation;

    return (
        <CardContent>
            <Stack spacing={5} mt={1}>
                <Stack spacing={3}>
                    <FormControl>
                        <FormLabel>Visibility</FormLabel>
                        <RadioGroup
                            row
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                        >
                            <FormControlLabel
                                value='public'
                                control={<Radio />}
                                label='Public'
                            />
                            <FormControlLabel
                                value='unlisted'
                                control={<Radio />}
                                label='Unlisted'
                            />
                        </RadioGroup>
                    </FormControl>

                    <FormControl>
                        <FormLabel>Default Orientation</FormLabel>
                        <RadioGroup
                            row
                            value={orientation}
                            onChange={(e) => setOrientation(e.target.value)}
                        >
                            <FormControlLabel
                                value='white'
                                control={<Radio />}
                                label='White'
                            />
                            <FormControlLabel
                                value='black'
                                control={<Radio />}
                                label='Black'
                            />
                        </RadioGroup>
                    </FormControl>
                </Stack>

                <Stack spacing={2}>
                    <Button variant='contained' disabled={saveDisabled}>
                        Save Changes
                    </Button>
                    <Button variant='outlined' onClick={() => navigate('edit')}>
                        Replace PGN
                    </Button>
                    <DeleteGameButton variant='contained' game={game} />
                </Stack>
            </Stack>
        </CardContent>
    );
};

export default Settings;
