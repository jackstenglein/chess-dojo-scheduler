import { pauseQueueDate, resetQueueDate } from '@/api/liveClassesApi';
import { useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString, toRRuleDate } from '@/components/calendar/displayDate';
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
import { datetime, RRule } from 'rrule';

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

    const datesByUser = getDatesByUser(gameReviewCohort, reviewQueue);

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell></TableCell>
                        <TableCell>User</TableCell>
                        <TableCell>Joined Queue At</TableCell>
                        <TableCell>Peer Review</TableCell>
                        <TableCell>Sensei Review</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {reviewQueue.map((member) => {
                        const queueDate = new Date(member.queueDate);
                        const peerReviewDate = datesByUser[member.username]
                            ? new Date(datesByUser[member.username].peerReview)
                            : undefined;
                        const senseiReviewDate = datesByUser[member.username]
                            ? new Date(datesByUser[member.username].senseiReview)
                            : undefined;

                        return (
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
                                    {toDojoDateString(new Date(queueDate), user?.timezoneOverride)}
                                    {' • '}
                                    {toDojoTimeString(
                                        new Date(queueDate),
                                        user?.timezoneOverride,
                                        user?.timeFormat,
                                    )}
                                </TableCell>

                                <TableCell>
                                    {member.paused
                                        ? '-'
                                        : peerReviewDate
                                          ? toDojoDateString(
                                                new Date(peerReviewDate),
                                                user?.timezoneOverride,
                                            )
                                          : '?'}
                                </TableCell>

                                <TableCell>
                                    {member.paused
                                        ? '-'
                                        : senseiReviewDate
                                          ? toDojoDateString(
                                                new Date(senseiReviewDate),
                                                user?.timezoneOverride,
                                            )
                                          : '?'}
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
                        );
                    })}
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

function getDatesByUser(
    gameReviewCohort: GameReviewCohort,
    reviewQueue: GameReviewCohortMember[],
): Record<string, { peerReview: Date; senseiReview: Date }> {
    const dates: Record<string, { peerReview: Date; senseiReview: Date }> = {};

    if (!gameReviewCohort.peerReviewEvent?.rrule || !gameReviewCohort.senseiReviewEvent?.rrule) {
        return dates;
    }

    const queueResetToday =
        new Date().toISOString().split('T')[0] === gameReviewCohort.queueLastResetAt?.split('T')[0];

    const peerReviewStart = new Date();
    if (!queueResetToday) {
        peerReviewStart.setDate(peerReviewStart.getDate() - 7);
    }

    let options = RRule.parseString(gameReviewCohort.peerReviewEvent.rrule);
    options.dtstart = toRRuleDate(new Date(gameReviewCohort.peerReviewEvent.startTime));
    const peerReviewRRule = new RRule(options);
    const peerReviewDates = peerReviewRRule.between(
        toRRuleDate(peerReviewStart),
        datetime(2050, 1, 1),
        false,
        (_: Date, i: number) => i < reviewQueue.length,
    );

    options = RRule.parseString(gameReviewCohort.senseiReviewEvent.rrule);
    options.dtstart = toRRuleDate(new Date(gameReviewCohort.senseiReviewEvent.startTime));
    const senseiReviewRule = new RRule(options);
    const senseiReviewDates = senseiReviewRule.between(
        toRRuleDate(new Date()),
        datetime(2050, 1, 1),
        !queueResetToday,
        (_, i) => i < reviewQueue.length + 1,
    );

    let i = 0;
    for (const member of reviewQueue) {
        if (member.paused) {
            continue;
        }
        dates[member.username] = {
            peerReview: peerReviewDates[i],
            senseiReview: senseiReviewDates[i],
        };
        i++;
    }
    return dates;
}
