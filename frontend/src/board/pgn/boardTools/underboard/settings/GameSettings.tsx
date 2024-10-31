import { BoardOrientation, parsePgnDate, toPgnDate } from '@/api/gameApi';
import { RequestSnackbar } from '@/api/Request';
import { Game } from '@/database/game';
import DeleteGameButton from '@/games/view/DeleteGameButton';
import useSaveGame, { SaveGameDetails } from '@/hooks/useSaveGame';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    FormControl,
    FormControlLabel,
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
import AnnotationWarnings from '../../../annotations/AnnotationWarnings';
import RequestReviewDialog from './RequestReviewDialog';

interface GameSettingsProps {
    game: Game;
    onSaveGame?: (g: Game) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({ game, onSaveGame }) => {
    const [gameDetails, setGameDetails] = useState<SaveGameDetails>({
        headers: game.headers,
        orientation: game.orientation ?? 'white',
        isPublishing: false,
    });
    const navigate = useNavigate();
    const { request, saveGame } = useSaveGame({ onSaveGame, game });

    const loading = request.isLoading();
    const headers = gameDetails.headers;

    const headersChanged = Object.entries(game.headers).some(
        ([name, value]) => value !== headers[name],
    );

    const orientationChanged = gameDetails.orientation !== game.orientation;

    const dirty = headersChanged || orientationChanged;

    const onChangeHeader = (name: string, value: string) => {
        setGameDetails((oldDetails) => ({
            ...oldDetails,
            headers: { ...oldDetails.headers, [name]: value },
        }));
    };

    const onChangeOrientation = (orientation: string) => {
        setGameDetails((oldDetails) => ({
            ...oldDetails,
            orientation: orientation as BoardOrientation,
        }));
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
                            value={gameDetails.orientation}
                            onChange={(e) => onChangeOrientation(e.target.value)}
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
            </Stack>

            <Stack spacing={2}>
                <RequestSnackbar request={request} showSuccess />
                <LoadingButton
                    variant='contained'
                    disabled={!dirty}
                    loading={loading}
                    onClick={() => saveGame(gameDetails)}
                >
                    Save Changes
                </LoadingButton>

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
