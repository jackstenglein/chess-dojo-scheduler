import {
    CardContent,
    InputAdornment,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    ToggleButtonProps,
    Tooltip,
    Button,
} from '@mui/material';
import ClockIcon from '@mui/icons-material/AccessAlarm';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

import { useChess } from './PgnBoard';
import { getInitialClock } from './PlayerHeader';
import React, { useEffect, useState } from 'react';
import { Event, EventType } from '@jackstenglein/chess';
import {
    Nag,
    evalNags,
    getNagInSet,
    getNagsInSet,
    moveNags,
    nags,
    positionalNags,
    setNagInSet,
    setNagsInSet,
} from './Nag';

export const CommentTextFieldId = 'commentTextField';
export const ClockTextFieldId = 'clockTextField';

interface NagButtonProps extends ToggleButtonProps {
    text: string;
    description: string;
}

const NagButton: React.FC<NagButtonProps> = ({ text, description, ...props }) => {
    return (
        <Tooltip title={description}>
            <ToggleButton {...props} sx={{ width: `${100 / 8}%` }}>
                <Stack alignItems='center' justifyContent='center'>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: '600' }}>
                        {text}
                    </Typography>
                </Stack>
            </ToggleButton>
        </Tooltip>
    );
};

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
                    EventType.UpdateComment,
                    EventType.UpdateNags,
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
    let comment = '';

    const move = chess?.currentMove();
    if (move) {
        clock = move.commentDiag?.clk || '';
        comment = move.commentAfter || '';
    } else {
        clock = getInitialClock(chess?.pgn) || '';
        comment = chess?.pgn.gameComment || '';
    }

    const handleExclusiveNag = (nagSet: Nag[]) => (event: any, newNag: string | null) => {
        const newNags = setNagInSet(newNag, nagSet, move?.nags);
        chess?.setNags(newNags);
    };

    const handleMultiNags = (nagSet: Nag[]) => (event: any, newNags: string[]) => {
        chess?.setNags(setNagsInSet(newNags, nagSet, move?.nags));
    };

    return (
        <CardContent>
            <Stack spacing={3}>
                <TextField
                    label='Clock'
                    id={ClockTextFieldId}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position='start'>
                                <ClockIcon
                                    sx={{
                                        color: !move ? 'text.secondary' : undefined,
                                    }}
                                />
                            </InputAdornment>
                        ),
                    }}
                    value={clock}
                    disabled={!move}
                    onChange={(event) => chess?.setCommand('clk', event.target.value)}
                    fullWidth
                />

                <TextField
                    label='Comments'
                    id={CommentTextFieldId}
                    multiline
                    minRows={3}
                    maxRows={9}
                    value={comment}
                    onChange={(event) => chess?.setComment(event.target.value)}
                    fullWidth
                />

                {move && (
                    <>
                        <Stack spacing={1}>
                            <ToggleButtonGroup
                                exclusive
                                value={getNagInSet(moveNags, chess?.currentMove()?.nags)}
                                onChange={handleExclusiveNag(moveNags)}
                            >
                                {moveNags.map((nag) => (
                                    <NagButton
                                        key={nag}
                                        value={nag}
                                        text={nags[nag].label}
                                        description={nags[nag].description}
                                    />
                                ))}
                            </ToggleButtonGroup>

                            <ToggleButtonGroup
                                exclusive
                                value={getNagInSet(evalNags, chess?.currentMove()?.nags)}
                                onChange={handleExclusiveNag(evalNags)}
                            >
                                {evalNags.map((nag) => (
                                    <NagButton
                                        key={nag}
                                        value={nag}
                                        text={nags[nag].label}
                                        description={nags[nag].description}
                                    />
                                ))}
                            </ToggleButtonGroup>

                            <ToggleButtonGroup
                                value={getNagsInSet(
                                    positionalNags,
                                    chess?.currentMove()?.nags
                                )}
                                onChange={handleMultiNags(positionalNags)}
                            >
                                {positionalNags.map((nag) => (
                                    <NagButton
                                        key={nag}
                                        value={nag}
                                        text={nags[nag].label}
                                        description={nags[nag].description}
                                    />
                                ))}
                            </ToggleButtonGroup>
                        </Stack>

                        <Stack spacing={1}>
                            <Button
                                startIcon={<CheckIcon />}
                                variant='outlined'
                                disabled={chess?.isInMainline(move)}
                                onClick={() => chess?.promoteVariation(move, true)}
                            >
                                Make main line
                            </Button>
                            <Button
                                startIcon={<ArrowUpwardIcon />}
                                variant='outlined'
                                disabled={!chess?.canPromoteVariation(move)}
                                onClick={() => chess?.promoteVariation(move)}
                            >
                                Move variation up
                            </Button>
                            <Button
                                startIcon={<DeleteIcon />}
                                variant='outlined'
                                onClick={() => chess?.delete(move)}
                            >
                                Delete from here
                            </Button>
                        </Stack>
                    </>
                )}
            </Stack>
        </CardContent>
    );
};

export default Editor;
