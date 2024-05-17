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
import {
    BoardOrientation,
    GameHeader,
    GameSubmissionType,
    UpdateGameRequest,
    isGame,
    isMissingData,
} from '../../../../../api/gameApi';
import { useFreeTier } from '../../../../../auth/Auth';
import { Game } from '../../../../../database/game';
import PublishGamePreflight from '../../../../../games/edit/PublishGamePreflight';
import DeleteGameButton from '../../../../../games/view/DeleteGameButton';
import { useChess } from '../../../PgnBoard';
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

                <Button
                    variant='outlined'
                    onClick={() => navigate('edit', { state: { game } })}
                >
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
    const { chess } = useChess();
    const isFreeTier = useFreeTier();
    const api = useApi();
    const request = useRequest<GameHeader>();
    const [showPreflight, setShowPreflight] = useState<boolean>(false);
    const loading = request.isLoading();

    const isPublishing = game.unlisted && visibility == 'public';
    const needsPreflight = isPublishing && isMissingData(game);
    const initHeaders: GameHeader = {
        white: game.headers.White,
        black: game.headers.Black,
        result: game.headers.Result,
        date: game.headers.Date,
    };

    const saveDisabled =
        (visibility === 'unlisted') === game.unlisted && orientation === game.orientation;

    const onShowPreflight = () => {
        setShowPreflight(true);
    };

    const onClosePreflight = () => {
        setShowPreflight(false);
        request.reset();
    };

    const onSave = (headers?: GameHeader) => {
        request.onStart();

        const update: UpdateGameRequest = {
            orientation,
            unlisted:
                (visibility === 'unlisted') === game.unlisted
                    ? undefined
                    : isFreeTier || visibility === 'unlisted',
            timelineId: game.timelineId,
        };

        if (headers) {
            update.headers = headers;
            update.type = GameSubmissionType.Manual;
            update.pgnText = chess?.renderPgn();
        }

        api.updateGame(game.cohort, game.id, update)
            .then((resp) => {
                trackEvent(EventType.UpdateGame, {
                    method: 'settings',
                    dojo_cohort: game.cohort,
                });

                if (isGame(resp.data)) {
                    onSaveGame?.(resp.data);
                }

                request.onSuccess();
                setShowPreflight(false);
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
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
                open={showPreflight}
                onClose={onClosePreflight}
                initHeaders={initHeaders}
                onSubmit={onSave}
                loading={loading}
            />
        </>
    );
};

export default GameSettings;
