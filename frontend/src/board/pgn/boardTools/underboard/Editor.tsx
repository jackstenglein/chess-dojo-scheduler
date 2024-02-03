import {
    CardContent,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
    ToggleButtonProps,
    Tooltip,
    Button,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

import { useChess } from '../../PgnBoard';
import { getInitialClock } from '../../PlayerHeader';
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
} from '../../Nag';
import { FormControl } from '@mui/base';

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

interface TimeSlots {
    hours: number;
    minutes: number;
    seconds: number;
}

function getTimeSlotsFromClock(clock: string): TimeSlots {
    const slots = clock.split(':');

    let seconds = parseFloat(slots[slots.length - 1] || '0');
    let minutes = parseInt(slots[slots.length - 2] || '0');
    let hours = parseInt(slots[slots.length - 3] || '0');

    return {
        hours,
        minutes,
        seconds,
    };
}

function getClockFromTimeSlots(slots: TimeSlots): string {
    const seconds = slots.seconds % 60;
    let minutes = slots.minutes + Math.floor(slots.seconds / 60);
    let hours = slots.hours + Math.floor(minutes / 60);
    minutes = minutes % 60;

    return `${hours}:${minutes.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
    })}:${seconds.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        maximumFractionDigits: 1,
    })}`;
}

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
    let clockCommand: 'emt' | 'clk' = 'clk';

    const move = chess?.currentMove();
    if (move) {
        clockCommand = move.commentDiag?.emt ? 'emt' : 'clk';
        clock = (move.commentDiag ? move.commentDiag[clockCommand] : '') || '';
        comment = move.commentAfter || '';
    } else {
        clock = getInitialClock(chess?.pgn) || '';
        comment = chess?.pgn.gameComment || '';
    }
    const timeSlots = getTimeSlotsFromClock(clock);

    const onChangeTime = (type: 'hours' | 'minutes' | 'seconds', value: string) => {
        let numValue = type === 'seconds' ? parseFloat(value) : parseInt(value);
        if (isNaN(numValue) || numValue < 0) {
            numValue = 0;
        }

        const newSlots: TimeSlots = {
            ...timeSlots,
            [type]: numValue,
        };

        chess?.setCommand(clockCommand, getClockFromTimeSlots(newSlots));
    };

    const onChangeClockCommand = (value: string) => {
        chess?.setCommand(clockCommand, '');
        chess?.setCommand(value, getClockFromTimeSlots(timeSlots));
    };

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
                <Stack spacing={1.5}>
                    <FormControl disabled={!move}>
                        <FormLabel>Clock</FormLabel>

                        <RadioGroup
                            value={clockCommand}
                            onChange={(e) => onChangeClockCommand(e.target.value)}
                        >
                            <FormControlLabel
                                value='clk'
                                control={<Radio size='small' />}
                                label='Time Left (%clk)'
                                disabled={!move}
                                slotProps={{ typography: { variant: 'body2' } }}
                            />
                            <FormControlLabel
                                value='emt'
                                control={<Radio size='small' />}
                                label='Elapsed Move Time (%emt)'
                                disabled={!move}
                                slotProps={{ typography: { variant: 'body2' } }}
                            />
                        </RadioGroup>
                    </FormControl>

                    <Stack direction='row' spacing={1}>
                        <TextField
                            label='Hours'
                            id={ClockTextFieldId}
                            value={timeSlots.hours}
                            disabled={!move}
                            onChange={(event) =>
                                onChangeTime('hours', event.target.value)
                            }
                            fullWidth
                        />

                        <TextField
                            label='Minutes'
                            id={ClockTextFieldId}
                            value={timeSlots.minutes}
                            disabled={!move}
                            onChange={(event) =>
                                onChangeTime('minutes', event.target.value)
                            }
                            fullWidth
                        />

                        <TextField
                            label='Seconds'
                            id={ClockTextFieldId}
                            value={timeSlots.seconds}
                            disabled={!move}
                            onChange={(event) =>
                                onChangeTime('seconds', event.target.value)
                            }
                            fullWidth
                        />
                    </Stack>
                </Stack>

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
