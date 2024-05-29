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
    TextField,
    Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventType, trackEvent } from '../../../../../analytics/events';
import { useApi } from '../../../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../../../api/Request';
import {
    BoardOrientation,
    GameHeader,
    GameSubmissionType,
    UpdateGameRequest,
    isGame,
    isMissingData,
    parsePgnDate,
    toPgnDate,
} from '../../../../../api/gameApi';
import { useFreeTier } from '../../../../../auth/Auth';
import { Game, PgnHeaders } from '../../../../../database/game';
import { PublishGamePreflight } from '../../../../../games/edit/MissingGameDataPreflight';
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
    const [visibility, setVisibility] = useState(
        game.unlisted ?? false ? 'unlisted' : 'published',
    );
    const [orientation, setOrientation] = useState<BoardOrientation>(
        game.orientation ?? 'white',
    );
    const [headers, setHeaders] = useState<PgnHeaders>(game.headers);

    const headersChanged = Object.entries(game.headers).some(
        ([name, value]) => value !== headers[name],
    );

    const unlisted = visibility === 'unlisted';
    const dirty =
        headersChanged ||
        orientation !== game.orientation ||
        (game.unlisted ?? false) !== unlisted;

    const navigate = useNavigate();

    const onChangeHeader = (name: string, value: string) => {
        setHeaders((oldHeaders) => ({ ...oldHeaders, [name]: value }));
    };

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
                            value='published'
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

                <Stack spacing={2}>
                    <FormLabel>Player Names</FormLabel>
                    <TextField
                        fullWidth
                        data-cy='white'
                        label='White'
                        value={headers.White}
                        onChange={(e) => onChangeHeader('White', e.target.value)}
                    />
                    <TextField
                        fullWidth
                        data-cy='black'
                        label='Black'
                        value={headers.Black}
                        onChange={(e) => onChangeHeader('Black', e.target.value)}
                    />
                </Stack>

                <FormControl>
                    <Stack spacing={2}>
                        <FormLabel>Date Played</FormLabel>
                        <DatePicker
                            label='Date'
                            value={parsePgnDate(headers.Date)}
                            onChange={(newValue) => {
                                onChangeHeader('Date', toPgnDate(newValue) ?? '');
                            }}
                            slotProps={{
                                textField: {
                                    id: 'date',
                                    fullWidth: true,
                                },
                                field: {
                                    clearable: true,
                                },
                            }}
                        />
                    </Stack>
                </FormControl>
            </Stack>

            <Stack spacing={2}>
                <SaveGameButton
                    game={game}
                    dirty={dirty}
                    headersChanged={headersChanged}
                    headers={headers}
                    orientation={orientation}
                    unlisted={unlisted}
                    onSaveGame={(game) => {
                        setHeaders(game.headers);
                        onSaveGame?.(game);
                    }}
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
    unlisted: boolean;
    orientation: BoardOrientation;
    headers: PgnHeaders;
    headersChanged: boolean;
    dirty: boolean;
    onSaveGame?: (g: Game) => void;
}

const SaveGameButton = ({
    game,
    unlisted,
    orientation,
    headers,
    headersChanged,
    dirty,
    onSaveGame,
}: SaveGameButtonProps) => {
    const { chess } = useChess();
    const api = useApi();
    const request = useRequest();
    const [showPreflight, setShowPreflight] = useState<boolean>(false);
    const loading = request.isLoading();

    const isPublishing = (game.unlisted ?? false) && !unlisted;
    const needsPreflight = !unlisted && isMissingData({ ...game, headers });

    const onShowPreflight = () => {
        setShowPreflight(true);
    };

    const onClosePreflight = () => {
        setShowPreflight(false);
        request.reset();
    };

    const onSave = (newHeaders?: GameHeader) => {
        request.onStart();

        if (!newHeaders && headersChanged) {
            newHeaders = {
                white: headers.White || '?',
                black: headers.Black || '??',
                result: headers.Result,
                date: headers.Date,
            };
        }

        const update: UpdateGameRequest = {
            orientation,
            timelineId: game.timelineId,
        };

        if (isPublishing) {
            update.unlisted = false;
        } else if (game.unlisted && unlisted) {
            update.unlisted = true;
        }

        if (newHeaders) {
            const pgnHeaders = {
                White: newHeaders.white,
                Black: newHeaders.black,
                Date: newHeaders.date,
            };

            for (const [name, value] of Object.entries(pgnHeaders)) {
                chess?.setHeader(name, value);
            }

            update.headers = newHeaders;
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
            <RequestSnackbar request={request} showSuccess />
            <LoadingButton
                variant='contained'
                disabled={!dirty}
                loading={loading}
                onClick={() => (needsPreflight ? onShowPreflight() : onSave())}
            >
                {isPublishing ? 'Publish' : 'Save Changes'}
            </LoadingButton>
            <PublishGamePreflight
                open={showPreflight}
                onClose={onClosePreflight}
                initHeaders={headers}
                onSubmit={onSave}
                loading={loading}
            />
        </>
    );
};

export default GameSettings;
