import {
    Button,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    Stack,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { ColorFormat } from 'react-countdown-circle-timer';
import { BlockBoardKeyboardShortcuts } from '../board/pgn/PgnBoard';
import { Scores } from './TacticsExamPage';

interface TacticsExamPgnSelectorProps {
    count: number;
    selected: number;
    onSelect: (v: number) => void;
    countdown?: CountdownProps;
    onComplete?: () => void;
    scores?: Scores;
    onReset?: () => void;
}

const TacticsExamPgnSelector: React.FC<TacticsExamPgnSelectorProps> = ({
    count,
    selected,
    onSelect,
    countdown,
    onComplete,
    scores,
    onReset,
}) => {
    const [isFinishEarly, setIsFinishEarly] = useState(false);

    return (
        <CardContent>
            <Stack
                spacing={3}
                direction='row'
                alignItems='center'
                justifyContent='center'
            >
                {countdown ? (
                    <>
                        <CountdownTimer {...countdown} />
                        <Button
                            variant='contained'
                            onClick={() => setIsFinishEarly(true)}
                        >
                            Finish Early
                        </Button>
                    </>
                ) : (
                    <Stack alignItems='center'>
                        <Typography variant='h6'>Test Complete</Typography>
                        <Typography variant='subtitle1'>
                            Total Score: {scores?.total.user} / {scores?.total.solution}
                        </Typography>
                    </Stack>
                )}
            </Stack>

            <List sx={{ mt: 2 }}>
                {Array.from(Array(count)).map((_, i) => (
                    <ListItem key={i} disablePadding>
                        <ListItemButton
                            selected={i === selected}
                            onClick={() => onSelect(i)}
                        >
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Stack alignItems='center' width={1}>
                                    <Typography
                                        sx={{
                                            color: 'primary.main',
                                        }}
                                    >
                                        {i + 1}
                                    </Typography>
                                </Stack>
                            </ListItemIcon>
                            <Stack
                                direction='row'
                                justifyContent='space-between'
                                width={1}
                                spacing={1}
                            >
                                <Typography>Problem {i + 1}</Typography>

                                {scores && (
                                    <Typography>
                                        {scores.problems[i].user} /{' '}
                                        {scores.problems[i].solution}
                                    </Typography>
                                )}
                            </Stack>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            {onReset && (
                <Stack alignItems='center' mt={3}>
                    <Button variant='contained' onClick={onReset}>
                        Reset Sample
                    </Button>
                </Stack>
            )}

            <Dialog
                open={isFinishEarly}
                onClose={() => setIsFinishEarly(false)}
                classes={{
                    container: BlockBoardKeyboardShortcuts,
                }}
                fullWidth
            >
                <DialogTitle>Finish Early?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to finish the test early? You will not be
                        able to change your answers if you continue.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsFinishEarly(false)}>Cancel</Button>
                    <Button onClick={onComplete}>Finish</Button>
                </DialogActions>
            </Dialog>
        </CardContent>
    );
};

export default TacticsExamPgnSelector;

const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = `0${time % 60}`.slice(-2);
    return `${minutes}:${seconds}`;
};

interface CountdownProps {
    elapsedTime: number;
    path: string;
    pathLength: number;
    remainingTime: number;
    rotation: 'clockwise' | 'counterclockwise';
    size: number;
    stroke: ColorFormat;
    strokeDashoffset: number;
    strokeWidth: number;
}

const CountdownTimer = (props: CountdownProps) => {
    const {
        path,
        pathLength,
        stroke,
        strokeDashoffset,
        remainingTime,
        size,
        strokeWidth,
    } = props;
    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg
                viewBox={`0 0 ${size} ${size}`}
                width={size}
                height={size}
                xmlns='http://www.w3.org/2000/svg'
            >
                <path
                    d={path}
                    fill='none'
                    stroke='rgba(0, 0, 0, 0)'
                    strokeWidth={strokeWidth}
                />
                <path
                    d={path}
                    fill='none'
                    stroke={stroke}
                    strokeLinecap={'round'}
                    strokeWidth={strokeWidth}
                    strokeDasharray={pathLength}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                }}
            >
                <span style={{ color: stroke }}>
                    <div>{formatTime(remainingTime)}</div>
                </span>
            </div>
        </div>
    );
};
