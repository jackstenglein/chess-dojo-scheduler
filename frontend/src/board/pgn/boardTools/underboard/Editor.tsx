import { Event, EventType, TAGS } from '@jackstenglein/chess';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Button,
    CardContent,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    ToggleButtonProps,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import { LocalizationProvider, TimeField } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { useEffect, useState } from 'react';
import {
    evalNags,
    getNagInSet,
    getNagsInSet,
    moveNags,
    Nag,
    nags,
    positionalNags,
    setNagInSet,
    setNagsInSet,
} from '../../Nag';
import { useChess } from '../../PgnBoard';
import {
    convertSecondsToDate,
    handleIncrement,
    handleInitialClock,
    onChangeClock,
} from './ClockEditor';
import { convertClockToSeconds, getIncrement, getInitialClock } from './ClockUsage';

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
                    <Typography sx={{ fontSize: '1.3rem', fontWeight: '600' }}>
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
                    EventType.UpdateHeader,
                ],
                handler: (event: Event) => {
                    if (
                        event.type === EventType.UpdateCommand &&
                        event.commandName !== 'clk'
                    ) {
                        return;
                    }
                    if (
                        event.type === EventType.UpdateHeader &&
                        event.headerName !== TAGS.TimeControl
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

    if (!chess) {
        return null;
    }

    const initialClock = getInitialClock(chess.pgn);
    const increment = getIncrement(chess.pgn);

    const move = chess.currentMove();
    const isMainline = chess.isInMainline(move);
    const comment = move ? move.commentAfter || '' : chess.pgn.gameComment || '';

    const handleExclusiveNag = (nagSet: Nag[]) => (event: any, newNag: string | null) => {
        const newNags = setNagInSet(newNag, nagSet, move?.nags);
        chess.setNags(newNags);
    };

    const handleMultiNags = (nagSet: Nag[]) => (event: any, newNags: string[]) => {
        chess.setNags(setNagsInSet(newNags, nagSet, move?.nags));
    };

    return (
        <CardContent>
            <Stack spacing={3} mt={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    {move && isMainline ? (
                        <TimeField
                            id={ClockTextFieldId}
                            label='Clock (hh:mm:ss)'
                            format='HH:mm:ss'
                            value={convertSecondsToDate(
                                convertClockToSeconds(move.commentDiag?.clk),
                            )}
                            onChange={(value) => onChangeClock(chess, move, value)}
                            fullWidth
                        />
                    ) : (
                        !move && (
                            <Grid2
                                container
                                columnSpacing={1}
                                rowGap={3}
                                alignItems='center'
                                pb={2}
                            >
                                <Grid2 xs={6}>
                                    <TimeField
                                        id={ClockTextFieldId}
                                        label='Starting Time (hh:mm:ss)'
                                        format='HH:mm:ss'
                                        value={convertSecondsToDate(initialClock)}
                                        onChange={(value) =>
                                            handleInitialClock(chess, increment, value)
                                        }
                                        fullWidth
                                    />
                                </Grid2>

                                <Grid2 xs={6}>
                                    <TextField
                                        id={ClockTextFieldId}
                                        label='Increment (Sec)'
                                        value={`${increment}`}
                                        onChange={(e) =>
                                            handleIncrement(
                                                chess,
                                                initialClock,
                                                e.target.value,
                                            )
                                        }
                                        fullWidth
                                    />
                                </Grid2>
                            </Grid2>
                        )
                    )}
                </LocalizationProvider>

                <TextField
                    label='Comments'
                    id={CommentTextFieldId}
                    multiline
                    minRows={Boolean(move) ? (isMainline ? 3 : 7) : 15}
                    maxRows={Boolean(move) ? 9 : 15}
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
                                    chess?.currentMove()?.nags,
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
