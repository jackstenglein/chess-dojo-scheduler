import { RequestSnackbar } from '@/api/Request';
import SaveGameDialogue from '@/components/games/edit/SaveGameDialogue';
import useSaveGame, { SaveGameDetails } from '@/hooks/useSaveGame';
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
import {
    BoardOrientation,
    isMissingData,
    parsePgnDate,
    toPgnDate,
} from '../../../../../api/gameApi';
import { useFreeTier } from '../../../../../auth/Auth';
import { Game } from '../../../../../database/game';
import DeleteGameButton from '../../../../../games/view/DeleteGameButton';
import AnnotationWarnings from '../../../annotations/AnnotationWarnings';
import RequestReviewDialog from './RequestReviewDialog';

interface GameSettingsProps {
    game: Game;
    onSaveGame?: (g: Game) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({ game, onSaveGame }) => {
    const isFreeTier = useFreeTier();
    const [visibility, setVisibility] = useState(
        game.unlisted ? 'unlisted' : 'published',
    );
    const [orientation, setOrientation] = useState<BoardOrientation>(
        game.orientation ?? 'white',
    );
    const [headers, setHeaders] = useState<SaveGameDetails>({
        white: headers.White,
        black: headers.Black,
    });
    const navigate = useNavigate();
    const [showPreflight, setShowPreflight] = useState<boolean>(false);
    const { request, saveGame } = useSaveGame({ onSaveGame, game });

    const loading = request.isLoading();

    const unlisted = visibility === 'unlisted';
    const isPublishing = (game.unlisted ?? false) && !unlisted;
    const needsPreflight = !unlisted && isMissingData({ ...game, headers });

    const headersChanged = Object.entries(game.headers).some(
        ([name, value]) => value !== headers[name],
    );

    const dirty =
        headersChanged ||
        orientation !== game.orientation ||
        (game.unlisted ?? false) !== unlisted;

    const onChangeHeader = (name: string, value: string) => {
        setHeaders((oldHeaders) => ({ ...oldHeaders, [name]: value }));
    };

    const onShowPreflight = () => {
        setShowPreflight(true);
    };

    const onClosePreflight = () => {
        setShowPreflight(false);
        request.reset();
    };

    return (
        <Stack spacing={5} mt={1}>
            <AnnotationWarnings />

            <Stack spacing={3}>
                <Typography variant='h5'>Game Settings</Typography>

                <Stack spacing={2}>
                    <TextField
                        fullWidth
                        data-cy='white'
                        label="White's Name"
                        value={headers.White}
                        onChange={(e) => onChangeHeader('White', e.target.value)}
                    />
                    <TextField
                        fullWidth
                        data-cy='black'
                        label="Black's Name"
                        value={headers.Black}
                        onChange={(e) => onChangeHeader('Black', e.target.value)}
                    />
                    <DatePicker
                        label='Date Played'
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
                </Stack>
            </Stack>

            <Stack spacing={2}>
                <RequestSnackbar request={request} showSuccess />
                <LoadingButton
                    variant='contained'
                    disabled={!dirty}
                    loading={loading}
                    onClick={() =>
                        needsPreflight ? onShowPreflight() : saveGame({ ...headers })
                    }
                >
                    {isPublishing ? 'Publish' : 'Save Changes'}
                </LoadingButton>
                <SaveGameDialogue
                    open={showPreflight}
                    onClose={onClosePreflight}
                    onSubmit={onSave}
                    loading={loading}
                    title='Provide missing data'
                >
                    Your game is missing data. Please fill out these fields to publish
                    your analysis.
                </SaveGameDialogue>

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

export default GameSettings;
