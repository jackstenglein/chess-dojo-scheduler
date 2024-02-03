import {
    Button,
    CardContent,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import DeleteGameButton from '../../../../games/view/DeleteGameButton';
import { Game } from '../../../../database/game';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useRequest } from '../../../../api/Request';
import { useApi } from '../../../../api/Api';
import { EventType, trackEvent } from '../../../../analytics/events';
import { isGame } from '../../../../api/gameApi';
import AnnotationWarnings from '../../annotations/AnnotationWarnings';
import { useFreeTier } from '../../../../auth/Auth';

interface SettingsProps {
    game: Game;
    onSaveGame?: (g: Game) => void;
}

const Settings: React.FC<SettingsProps> = ({ game, onSaveGame }) => {
    const isFreeTier = useFreeTier();
    const [visibility, setVisibility] = useState(game.unlisted ? 'unlisted' : 'public');
    const [orientation, setOrientation] = useState<string>(game.orientation || 'white');
    const navigate = useNavigate();
    const request = useRequest();
    const api = useApi();

    const saveDisabled =
        (visibility === 'unlisted') === game.unlisted && orientation === game.orientation;

    const onSave = () => {
        request.onStart();
        api.updateGame(game.cohort, game.id, {
            orientation,
            unlisted:
                (visibility === 'unlisted') === game.unlisted
                    ? undefined
                    : isFreeTier || visibility === 'unlisted',
            timelineId: game.timelineId,
        })
            .then((resp) => {
                trackEvent(EventType.UpdateGame, {
                    method: 'settings',
                    dojo_cohort: game.cohort,
                });
                request.onSuccess();
                if (isGame(resp.data)) {
                    onSaveGame?.(resp.data);
                }
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
    };

    return (
        <CardContent>
            <Stack spacing={5} mt={1}>
                <AnnotationWarnings />

                <Stack spacing={3}>
                    <FormControl disabled={isFreeTier}>
                        <FormLabel>Visibility</FormLabel>
                        <RadioGroup
                            row
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                        >
                            <FormControlLabel
                                value='public'
                                control={<Radio disabled={isFreeTier} />}
                                label='Public'
                            />
                            <FormControlLabel
                                value='unlisted'
                                control={<Radio disabled={isFreeTier} />}
                                label='Unlisted'
                            />
                        </RadioGroup>
                        {isFreeTier && (
                            <FormHelperText>
                                Free-tier users can only submit unlisted games
                            </FormHelperText>
                        )}
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
                    <LoadingButton
                        variant='contained'
                        disabled={saveDisabled}
                        loading={request.isLoading()}
                        onClick={onSave}
                    >
                        Save Changes
                    </LoadingButton>
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
