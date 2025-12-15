import { pauseQueueDate, resetQueueDate } from '@/api/liveClassesApi';
import { useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString } from '@/components/calendar/displayDate';
import { Link } from '@/components/navigation/Link';
import Avatar from '@/profile/Avatar';
import {
    GameReviewCohort,
    GameReviewCohortMember,
} from '@jackstenglein/chess-dojo-common/src/liveClasses/api';
import { Block } from '@mui/icons-material';
import {
    Button,
    ButtonProps,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';

export function GameReviewCohortQueue({
    gameReviewCohort,
    setGameReviewCohort,
}: {
    gameReviewCohort: GameReviewCohort;
    setGameReviewCohort: (grc: GameReviewCohort) => void;
}) {
    const { user } = useAuth();
    const request = useRequest();

    const onPause = async (username: string, pause: boolean) => {
        try {
            request.onStart();
            const response = await pauseQueueDate({ id: gameReviewCohort.id, username, pause });
            setGameReviewCohort(response.data.gameReviewCohort);
            request.onSuccess();
        } catch (err) {
            request.onFailure(err);
        }
    };

    const onMoveToBottom = async (username: string) => {
        try {
            request.onStart();
            const response = await resetQueueDate({ id: gameReviewCohort.id, username });
            setGameReviewCohort(response.data.gameReviewCohort);
            request.onSuccess();
        } catch (err) {
            request.onFailure(err);
        }
    };

    const reviewQueue = Object.values(gameReviewCohort.members).sort((lhs, rhs) =>
        lhs.queueDate.localeCompare(rhs.queueDate),
    );
    let index = 1;

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Joined Queue At</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {reviewQueue.map((member) => (
                        <TableRow key={member.username}>
                            <TableCell>
                                {member.paused ? (
                                    <Tooltip title='This user is paused. They will be skipped in the queue until they unpause.'>
                                        <Block sx={{ color: 'text.secondary' }} />
                                    </Tooltip>
                                ) : (
                                    <Typography variant='h6' sx={{ mr: 2 }}>
                                        {index++}
                                    </Typography>
                                )}
                            </TableCell>

                            <TableCell>
                                <Stack direction='row' alignItems='center'>
                                    <Avatar
                                        username={member.username}
                                        displayName={member.displayName}
                                        size={30}
                                        sx={{ opacity: member.paused ? 0.75 : 1 }}
                                    />
                                    <Link
                                        href={`/profile/${member.username}`}
                                        sx={{
                                            ml: 1,
                                            color: member.paused ? 'text.secondary' : undefined,
                                        }}
                                    >
                                        {member.displayName}
                                    </Link>
                                </Stack>
                            </TableCell>

                            <TableCell>
                                {toDojoDateString(
                                    new Date(member.queueDate),
                                    user?.timezoneOverride,
                                )}
                                {' • '}
                                {toDojoTimeString(
                                    new Date(member.queueDate),
                                    user?.timezoneOverride,
                                    user?.timeFormat,
                                )}
                            </TableCell>

                            <TableCell>
                                {user?.isAdmin && (
                                    <>
                                        <PauseButton
                                            member={member}
                                            onClickPause={onPause}
                                            disabled={request.isLoading()}
                                        />
                                        <Button
                                            color='error'
                                            variant='contained'
                                            onClick={() => onMoveToBottom(member.username)}
                                            disabled={request.isLoading()}
                                            sx={{ ml: 2 }}
                                        >
                                            Move to Bottom
                                        </Button>
                                    </>
                                )}
                                {user?.username === member.username && !user.isAdmin && (
                                    <PauseButton
                                        member={member}
                                        onClickPause={onPause}
                                        disabled={request.isLoading()}
                                    />
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

function PauseButton({
    member,
    onClickPause,
    ...props
}: ButtonProps & {
    member: GameReviewCohortMember;
    onClickPause: (username: string, pause: boolean) => void;
}) {
    return (
        <Button
            color='secondary'
            variant='contained'
            onClick={() => onClickPause(member.username, !member.paused)}
            {...props}
        >
            {member.paused ? 'Unpause' : 'Pause'}
        </Button>
    );
}
