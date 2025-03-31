import { Check, Warning } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
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
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { ColorFormat } from 'react-countdown-circle-timer';
import { BlockBoardKeyboardShortcuts } from '../../board/pgn/PgnBoard';

export enum ProblemStatus {
    Unknown = '',
    Complete = 'COMPLETE',
    NeedsReview = 'NEEDS_REVIEW',
}

export interface ExamPgnSelectorProps {
    name: string;
    cohortRange: string;
    count: number;
    selected: number;
    onSelect: (v: number) => void;
    countdown: CountdownProps;
    onComplete?: () => void;
    orientations: string[];
    pgnNames?: string[];
    problemStatus?: Record<number, ProblemStatus>;
    setProblemStatus?: (status: Record<number, ProblemStatus>) => void;
    onPause?: () => void;
    pauseLoading?: boolean;
}

const ExamPgnSelector: React.FC<ExamPgnSelectorProps> = ({
    name,
    cohortRange,
    count,
    selected,
    onSelect,
    countdown,
    onComplete,
    orientations,
    pgnNames,
    problemStatus,
    setProblemStatus,
    onPause,
    pauseLoading,
}) => {
    const [isFinishEarly, setIsFinishEarly] = useState(false);
    const [statusAnchorEl, setStatusAnchorEl] = useState<HTMLElement | null>(null);
    const [openStatusProblem, setOpenStatusProblem] = useState(-1);

    const handleOpenStatusMenu = (i: number, e: React.MouseEvent<HTMLDivElement>) => {
        if (problemStatus && setProblemStatus) {
            e.preventDefault();
            setOpenStatusProblem(i);
            setStatusAnchorEl(e.currentTarget);
        }
    };

    const handleCloseStatusMenu = () => {
        setOpenStatusProblem(-1);
        setStatusAnchorEl(null);
    };

    const markStatus = (status: ProblemStatus) => {
        setProblemStatus?.({
            ...problemStatus,
            [openStatusProblem]: status,
        });
        handleCloseStatusMenu();
    };

    return (
        <CardContent>
            <Stack alignItems='center' mb={3}>
                <Typography variant='h6' color='text.secondary'>
                    {cohortRange}: {name}
                </Typography>
            </Stack>
            <Stack spacing={3} direction='row' alignItems='center' justifyContent='center'>
                <CountdownTimer {...countdown} />
                {onPause && (
                    <LoadingButton variant='contained' onClick={onPause} loading={pauseLoading}>
                        {pauseLoading ? 'Saving...' : 'Pause'}
                    </LoadingButton>
                )}
            </Stack>

            <List sx={{ mt: 2 }}>
                {Array.from(Array(count)).map((_, i) => (
                    <ListItem key={i} disablePadding>
                        <ListItemButton
                            selected={i === selected}
                            onClick={() => onSelect(i)}
                            onContextMenu={(e) => handleOpenStatusMenu(i, e)}
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
                                <Typography>{pgnNames?.[i] || `Problem ${i + 1}`}</Typography>

                                <Stack direction='row' spacing={2}>
                                    {problemStatus?.[i] === ProblemStatus.Complete && (
                                        <Tooltip title='You marked this problem as complete. Right click to change.'>
                                            <Check color='success' />
                                        </Tooltip>
                                    )}
                                    {problemStatus?.[i] === ProblemStatus.NeedsReview && (
                                        <Tooltip title='You marked this problem as needs review. Right click to change.'>
                                            <Warning color='warning' />
                                        </Tooltip>
                                    )}
                                    <Typography color='text.secondary'>
                                        {orientations[i][0].toUpperCase()}
                                        {orientations[i].slice(1)}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>

            <Stack alignItems='center' mt={3}>
                <Button
                    variant='contained'
                    onClick={() => setIsFinishEarly(true)}
                    sx={{ alignSelf: 'center' }}
                >
                    Finish Early
                </Button>
            </Stack>

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
                        Are you sure you want to finish the test early? This will end the entire
                        test, and you will not be able to change your answers if you continue.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsFinishEarly(false)}>Cancel</Button>
                    <Button onClick={onComplete}>Finish</Button>
                </DialogActions>
            </Dialog>

            <Menu
                anchorEl={statusAnchorEl}
                open={Boolean(statusAnchorEl)}
                onClose={handleCloseStatusMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
            >
                <MenuItem
                    onClick={() => markStatus(ProblemStatus.Complete)}
                    disabled={problemStatus?.[openStatusProblem] === ProblemStatus.Complete}
                >
                    Mark as Completed
                </MenuItem>
                <MenuItem
                    onClick={() => markStatus(ProblemStatus.NeedsReview)}
                    disabled={problemStatus?.[openStatusProblem] === ProblemStatus.NeedsReview}
                >
                    Mark as Needs Review
                </MenuItem>
                <MenuItem
                    onClick={() => markStatus(ProblemStatus.Unknown)}
                    disabled={!problemStatus?.[openStatusProblem]}
                >
                    Clear Status
                </MenuItem>
            </Menu>
        </CardContent>
    );
};

export default ExamPgnSelector;

export const formatTime = (time: number) => {
    time = Math.round(time);
    const minutes = `0${Math.floor(time / 60)}`.slice(-2);
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
    const { path, pathLength, stroke, strokeDashoffset, remainingTime, size, strokeWidth } = props;
    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg
                viewBox={`0 0 ${size} ${size}`}
                width={size}
                height={size}
                xmlns='http://www.w3.org/2000/svg'
            >
                <path d={path} fill='none' stroke='rgba(0, 0, 0, 0)' strokeWidth={strokeWidth} />
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
