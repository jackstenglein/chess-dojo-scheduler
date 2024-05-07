import { LoadingButton } from '@mui/lab';
import {
    Button,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from '@mui/material';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventType, trackEvent } from '../../../../../analytics/events';
import { useApi } from '../../../../../api/Api';
import { useRequest } from '../../../../../api/Request';
import { BoardOrientation, GameHeader, isGame } from '../../../../../api/gameApi';
import { useFreeTier } from '../../../../../auth/Auth';
import { Game } from '../../../../../database/game';
import PublishGamePreflight from '../../../../../games/edit/PublishGamePreflight';
import DeleteGameButton from '../../../../../games/view/DeleteGameButton';
import AnnotationWarnings from '../../../annotations/AnnotationWarnings';
import RequestReviewDialog from './RequestReviewDialog';

interface GameSettingsProps {
    game: Game;
    onSaveGame?: (g: Game) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({ game, onSaveGame }) => {
    const isFreeTier = useFreeTier();
    const [visibility, setVisibility] = useState(game.unlisted ? 'unlisted' : 'public');
    const [orientation, setOrientation] = useState<BoardOrientation>(
        game.orientation ?? 'white',
    );
    const navigate = useNavigate();

    return (
        <Stack spacing={5} mt={1}>
            <AnnotationWarnings />

            <Stack spacing={3}>
                <Typography variant='h5'>Game Settings</Typography>

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
                            label='Published'
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
                        onChange={(e) =>
                            setOrientation(e.target.value as BoardOrientation)
                        }
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
                <SaveGameButton
                    game={game}
                    orientation={orientation}
                    visibility={visibility}
                    onSaveGame={onSaveGame}
                />

                <RequestReviewDialog game={game} />

                <Button variant='outlined' onClick={() => navigate('edit')}>
                    Replace PGN
                </Button>
                <DeleteGameButton variant='contained' game={game} />
            </Stack>
        </Stack>
    );
};

interface SaveGameButtonProps {
    game: Game;
    visibility: string;
    orientation: BoardOrientation;
    onSaveGame?: (g: Game) => void;
}

const SaveGameButton = ({
    game,
    visibility,
    orientation,
    onSaveGame,
}: SaveGameButtonProps) => {
    const isFreeTier = useFreeTier();
    const api = useApi();
    const request = useRequest();
    const initHeaders = {
        white: game.headers.White,
        black: game.headers.Black,
        date: game.headers.Date,
        result: game.headers.Result,
    };
    const [showPublishingModal, setShowPublishingModal] = useState<boolean>(false);
    const loading = request.isLoading();

    const isPublishing = (game.unlisted ?? true) && visibility == 'public';
    // TODO: detect missing or incorrect data
    const isMissingData = isPublishing;
    const needsPreflight = isPublishing && isMissingData;

    const saveDisabled =
        (visibility === 'unlisted') === game.unlisted && orientation === game.orientation;

    const onShowPreflight = () => {
        setShowPublishingModal(true);
    };

    const onSave = (headers?: GameHeader[]) => {
        request.onStart();
        api.updateGame(game.cohort, game.id, {
            orientation,
            headers: headers,
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

    const onClose = () => {
        setShowPublishingModal(false);
        request.reset();
    };

    return (
        <>
            <LoadingButton
                variant='contained'
                disabled={saveDisabled}
                loading={loading}
                onClick={() => (needsPreflight ? onShowPreflight() : onSave())}
            >
                {isPublishing ? 'Publish' : 'Save Changes'}
            </LoadingButton>
            <PublishGamePreflight
                open={showPublishingModal}
                onClose={onClose}
                initHeaders={[initHeaders]}
                onSubmit={onSave}
                loading={loading}
            />
        </>
    );
};

export default GameSettings;
