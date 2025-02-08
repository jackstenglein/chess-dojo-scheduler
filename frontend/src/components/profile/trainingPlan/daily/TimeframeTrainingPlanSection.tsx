import { useRequirements } from '@/api/cache/requirements';
import {
    CustomTask,
    formatTime,
    Requirement,
    SuggestedTask,
} from '@/database/requirement';
import { ALL_COHORTS, User } from '@/database/user';
import { useTimelineContext } from '@/profile/activity/useTimeline';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    CircularProgress,
    CircularProgressProps,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { ReactNode, useMemo } from 'react';
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
                sx={{ cursor: toggleExpanded ? undefined : 'unset !important' }}
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
                    <CircularProgressWithLabel value={currentTime} max={goalTime} />
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Divider />
                {tasks.map(({ task, goalMinutes }) => {
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

function CircularProgressWithLabel(
    props: CircularProgressProps & { value: number; max: number },
) {
    const clampedValue = Math.min(100, (props.value / props.max) * 100);

    return (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
                variant='determinate'
                value={100}
                sx={{
                    position: 'absolute',
                    color: 'var(--mui-palette-LinearProgress-primaryBg)',
                }}
                size='3.5rem'
            />
            <CircularProgress
                variant='determinate'
                {...props}
                size='3.5rem'
                value={clampedValue}
                color={clampedValue === 100 ? 'success' : 'primary'}
            />
            <Box
                sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    variant='caption'
                    component='div'
                    sx={{ color: 'text.secondary' }}
                >
                    {formatTime(props.value)}
                </Typography>
            </Box>
        </Box>
    );
}
