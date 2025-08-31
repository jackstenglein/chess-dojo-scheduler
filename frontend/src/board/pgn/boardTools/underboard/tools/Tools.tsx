import { useChess } from '@/board/pgn/PgnBoard';
import { PlayAs } from '@/board/pgn/solitaire/useSolitaireChess';
import {
    Alert,
    Button,
    CardContent,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Snackbar,
    Stack,
    Typography,
} from '@mui/material';
import { useState } from 'react';

/**
 * Renders an underboard tab with miscellaneous tools. Currently, this
 * contains only the solitare chess controls.
 */
export function Tools() {
    const { chess, solitaire } = useChess();
    const [error, setError] = useState('');

    const onStartFromMove = () => {
        if (chess?.currentMove() === chess?.lastMove()) {
            setError('Cannot start from the last move');
            return;
        }
        if (!chess?.isInMainline()) {
            setError('Cannot start from a variation');
            return;
        }
        solitaire?.start(chess.currentMove());
    };

    return (
        <CardContent>
            <Snackbar open={!!error} onClose={() => setError('')} autoHideDuration={4000}>
                <Alert severity='error' variant='filled'>
                    {error}
                </Alert>
            </Snackbar>

            <Stack>
                <Typography variant='h6'>Solitaire Chess (Guess the Move)</Typography>
                <Divider />
                <Typography mt={1}>
                    Test your understanding (or memory) of this game by guessing the moves. Starting
                    this mode will hide the PGN text until you correctly pick the next move.
                </Typography>

                <FormControl sx={{ mt: 2 }} disabled={solitaire?.enabled}>
                    <FormLabel>Play As</FormLabel>
                    <RadioGroup
                        row
                        value={solitaire?.playAs}
                        onChange={(e) => solitaire?.setPlayAs(e.target.value as PlayAs)}
                    >
                        <FormControlLabel value='both' control={<Radio />} label='Both' />
                        <FormControlLabel value='white' control={<Radio />} label='White' />
                        <FormControlLabel value='black' control={<Radio />} label='Black' />
                    </RadioGroup>
                </FormControl>

                <FormControlLabel
                    label='Add incorrect guesses to PGN'
                    control={
                        <Checkbox
                            checked={solitaire?.addWrongMoves}
                            onChange={(e) => solitaire?.setAddWrongMoves(e.target.checked)}
                        />
                    }
                    sx={{ mt: 2 }}
                />

                {!solitaire?.enabled ? (
                    <Stack direction='row' gap={1} flexWrap='wrap' mt={2}>
                        <Button onClick={() => solitaire?.start(null)}>Start from Beginning</Button>
                        <Button onClick={onStartFromMove}>Start from Current Move</Button>
                    </Stack>
                ) : (
                    <Button onClick={solitaire.stop} sx={{ mt: 2 }}>
                        Exit Solitaire Mode
                    </Button>
                )}
            </Stack>
        </CardContent>
    );
}
