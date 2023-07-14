import { Card, CardContent, InputAdornment, Stack, TextField } from '@mui/material';
import ClockIcon from '@mui/icons-material/AccessAlarm';

import { useChess } from './PgnBoard';
import { getInitialClock } from './PlayerHeader';
import { useEffect, useState } from 'react';
import { Event, EventType } from '@jackstenglein/chess';

const Editor = () => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.UpdateCommand,
                ],
                handler: (event: Event) => {
                    if (
                        event.type === EventType.UpdateCommand &&
                        event.commandName !== 'clk'
                    ) {
                        return;
                    }
                    setForceRender((v) => v + 1);
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    let clock = '';
    if (chess) {
        const move = chess.currentMove();
        if (move) {
            clock = move.commentDiag?.clk || '';
        } else {
            clock = getInitialClock(chess.pgn) || '';
        }
    }

    return (
        <Card
            elevation={3}
            sx={{ boxShadow: 'none', overflowY: 'auto', maxHeight: '22em' }}
        >
            <CardContent>
                <Stack direction='row'>
                    <TextField
                        label='Clock'
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <ClockIcon
                                        sx={{
                                            color: !chess?.currentMove()
                                                ? 'text.secondary'
                                                : undefined,
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        }}
                        value={clock}
                        disabled={!chess?.currentMove()}
                        onChange={(event) => chess?.setCommand('clk', event.target.value)}
                    />
                </Stack>
            </CardContent>
        </Card>
    );
};

export default Editor;
