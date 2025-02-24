import { useRequirements } from '@/api/cache/requirements';
import { CustomTask, formatTime, Requirement } from '@/database/requirement';
import { ALL_COHORTS, User } from '@/database/user';
import { useTimelineContext } from '@/profile/activity/useTimeline';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { ReactNode, useMemo } from 'react';
import { CircularTimeProgress } from '../CircularTimeProgress';
import { ScheduleClassicalGame } from '../ScheduleClassicalGame';
import { SCHEDULE_CLASSICAL_GAME_TASK_ID, SuggestedTask } from '../suggestedTasks';
import { TimeframeTrainingPlanItem } from './TimeframeTrainingPlanItem';

interface TimeframeTrainingPlanSectionProps {
    /** The minimum date (inclusive) that the tasks apply to, in ISO 8601. */
    startDate: string;
    /** The maximum date (exclusive) that the tasks apply to, in ISO 8601. */
    endDate: string;
    /** The title of the section. */
    title: string;
    /** The icon of the section. */
    icon?: ReactNode;
    /** The user whose training plan is being displayed. */
    user: User;
    /** Whether the user is the current signed-in user. */
    isCurrentUser: boolean;
    /** The tasks to display in the section. */
    tasks: SuggestedTask[];
    /** The set of tasks pinned by the user. */
    pinnedTasks: (Requirement | CustomTask)[];
    /** A callback invoked when the user toggles pinning the task. */
    togglePin: (req: Requirement | CustomTask) => void;
    /** Whether the accordion is expanded or not. */
    expanded: boolean;
    /** A callback invoked when the expanded state is changed. */
    toggleExpanded?: () => void;
    /** Whether to disable including extra tasks that the user worked on in the timeframe. */
    disableExtraTasks?: boolean;
}

export function TimeframeTrainingPlanSection({
    startDate,
    endDate,
    title,
    icon,
    user,
    isCurrentUser,
    tasks,
    pinnedTasks,
    togglePin,
    expanded,
    toggleExpanded,
    disableExtraTasks,
}: TimeframeTrainingPlanSectionProps) {
    const { entries: timeline } = useTimelineContext();
    const { requirements } = useRequirements(ALL_COHORTS, false);

    const [currentTime, goalTime, extraTaskIds] = useMemo(() => {
        const goalMinutes = tasks.reduce((sum, { goalMinutes }) => sum + goalMinutes, 0);
        const extraTaskIds = new Set<string>();

        let timeWorked = 0;
        for (const entry of timeline) {
            const date = entry.date || entry.createdAt;
            const isSuggestedTask = tasks.some(
                ({ task, goalMinutes }) =>
                    goalMinutes > 0 && task.id === entry.requirementId,
            );
            if (
                date >= startDate &&
                date < endDate &&
                (!disableExtraTasks || isSuggestedTask)
            ) {
                timeWorked += entry.minutesSpent;
                if (!isSuggestedTask) {
                    extraTaskIds.add(entry.requirementId);
                }
            }
        }

        return [timeWorked, goalMinutes, extraTaskIds];
    }, [tasks, startDate, endDate, timeline, disableExtraTasks]);

    const extraTasks = useMemo(() => {
        const extraTasks: (Requirement | CustomTask)[] = [];

        extraTaskIds.forEach((id) => {
            const task =
                requirements.find((t) => t.id === id) ||
                user.customTasks?.find((t) => t.id === id);
            if (task) {
                extraTasks.push(task);
            }
        });

        return extraTasks;
    }, [extraTaskIds, user.customTasks, requirements]);

    return (
        <Accordion expanded={expanded} onChange={toggleExpanded} sx={{ width: 1 }}>
            <AccordionSummary
                component='div'
                sx={{
                    cursor: toggleExpanded ? undefined : 'unset !important',
                    paddingRight: 1,
                    '& .MuiAccordionSummary-content': {
                        marginTop: 1.5,
                        marginBottom: 1.5,
                        '&.Mui-expanded': {
                            marginBottom: 0,
                        },
                    },
                }}
            >
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='center'
                    flexWrap='wrap'
                    columnGap='1rem'
                    rowGap={0.5}
                    sx={{ width: 1, mr: 2 }}
                >
                    <Typography fontWeight='bold'>
                        {icon}
                        {title} - {formatTime(goalTime)}
                    </Typography>
                    <Stack
                        sx={{
                            width: '80px',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <CircularTimeProgress value={currentTime} max={goalTime} />
                    </Stack>
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Divider />
                {tasks.map(({ task, goalMinutes }) => {
                    if (task.id === SCHEDULE_CLASSICAL_GAME_TASK_ID) {
                        return (
                            <ScheduleClassicalGame
                                key={SCHEDULE_CLASSICAL_GAME_TASK_ID}
                            />
                        );
                    }
                    if (goalMinutes === 0) {
                        return null;
                    }
                    return (
                        <TimeframeTrainingPlanItem
                            key={task.id}
                            startDate={startDate}
                            endDate={endDate}
                            task={task}
                            goalMinutes={goalMinutes}
                            progress={user.progress[task.id]}
                            cohort={user.dojoCohort}
                            isCurrentUser={isCurrentUser}
                            isPinned={pinnedTasks.some((t) => t.id === task.id)}
                            togglePin={togglePin}
                        />
                    );
                })}

                {extraTasks.length > 0 && (
                    <>
                        <Typography
                            variant='body1'
                            fontWeight={700}
                            sx={{ mt: 6, mb: 1 }}
                        >
                            Unscheduled Work
                        </Typography>
                        <Divider sx={{ mb: 4 }} />
                    </>
                )}

                {extraTasks.map((task) => {
                    return (
                        <TimeframeTrainingPlanItem
                            key={task.id}
                            startDate={startDate}
                            endDate={endDate}
                            task={task}
                            goalMinutes={0}
                            progress={user.progress[task.id]}
                            cohort={user.dojoCohort}
                            isCurrentUser={isCurrentUser}
                            isPinned={pinnedTasks.some((t) => t.id === task.id)}
                            togglePin={togglePin}
                        />
                    );
                })}
            </AccordionDetails>
        </Accordion>
    );
}
