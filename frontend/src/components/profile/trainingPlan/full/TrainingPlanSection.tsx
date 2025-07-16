import { useFreeTier } from '@/auth/Auth';
import {
    CustomTask,
    CustomTaskCategory,
    isCustomTaskCategory,
    isRequirement,
    Requirement,
    RequirementCategory,
} from '@/database/requirement';
import { User } from '@/database/user';
import { ProgressText } from '@/scoreboard/ScoreboardProgress';
import { Checklist } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Divider,
    Stack,
    SvgIconOwnProps,
    Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import CustomTaskEditor from '../CustomTaskEditor';
import { ScheduleClassicalGame } from '../ScheduleClassicalGame';
import { SCHEDULE_CLASSICAL_GAME_TASK_ID } from '../suggestedTasks';
import { TrainingPlanIcon } from '../TrainingPlanIcon';
import { FullTrainingPlanItem } from './FullTrainingPlanItem';

/** A section in the training plan view. */
export interface Section {
    /** The category of the section. */
    category: RequirementCategory;
    /** The uncompleted tasks to display in the section. */
    uncompletedTasks: (Requirement | CustomTask)[];
    /** The completed tasks in the section. */
    completedTasks: (Requirement | CustomTask)[];
    /** The color of the icon in the section header. */
    color?: SvgIconOwnProps['color'];
}

interface TrainingPlanSectionProps {
    /** The section of the training plan to render. */
    section: Section;
    /** Whether the section is expanded. */
    expanded?: boolean;
    /** A callback invoked when the section expansion is toggled. */
    toggleExpand: (category: RequirementCategory) => void;
    /** The user whose training plan is being displayed. */
    user: User;
    /** Whether the user being displayed is the current authenticated user. */
    isCurrentUser: boolean;
    /** The cohort being displayed. */
    cohort: string;
    /** A callback invoked when the user toggles a pinned task. */
    togglePin: (req: Requirement | CustomTask) => void;
    /** The set of pinned tasks. */
    pinnedTasks: (Requirement | CustomTask)[];
    /** Whether to show completed tasks */
    showCompleted: boolean;
    /** Callback to set whether to show completed tasks. */
    setShowCompleted: (v: boolean) => void;
}

export function TrainingPlanSection({
    section,
    expanded,
    toggleExpand,
    user,
    isCurrentUser,
    cohort,
    togglePin,
    pinnedTasks,
    showCompleted,
    setShowCompleted,
}: TrainingPlanSectionProps) {
    const isFreeTier = useFreeTier();
    const [showCustomTaskEditor, setShowCustomTaskEditor] = useState(false);

    const hiddenTaskCount = useMemo(() => {
        if (!isFreeTier) {
            return 0;
        }
        return section.uncompletedTasks.filter((r) => isRequirement(r) && !r.isFree).length;
    }, [section.uncompletedTasks, isFreeTier]);

    return (
        <Accordion
            key={section.category}
            expanded={expanded}
            onChange={() => toggleExpand(section.category)}
            sx={{ width: 1 }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${section.category.replaceAll(' ', '-')}-content`}
                id={`${section.category.replaceAll(' ', '-')}-header`}
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
                        <TrainingPlanIcon
                            category={section.category}
                            color={section.color || 'primary'}
                            sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                        />
                        {section.category}
                    </Typography>
                    <ProgressText
                        value={section.completedTasks.length}
                        max={section.completedTasks.length + section.uncompletedTasks.length}
                        min={0}
                        suffix='Complete'
                    />
                </Stack>
            </AccordionSummary>
            <AccordionDetails data-cy={`progress-category-${section.category}`}>
                <Divider />

                <TaskList
                    tasks={section.uncompletedTasks}
                    user={user}
                    cohort={cohort}
                    isFreeTier={isFreeTier}
                    isCurrentUser={isCurrentUser}
                    togglePin={togglePin}
                    pinnedTasks={pinnedTasks}
                />

                {section.completedTasks.length > 0 &&
                    (showCompleted ? (
                        <>
                            <Stack direction='row' alignItems='center' sx={{ mt: 6, mb: 1 }}>
                                <Checklist color='primary' />
                                <Typography
                                    variant='body1'
                                    fontWeight={700}
                                    sx={{ ml: 1, flexGrow: 1 }}
                                >
                                    Completed Tasks
                                </Typography>
                                <Button onClick={() => setShowCompleted(false)}>Hide</Button>
                            </Stack>

                            <Divider sx={{ mb: 2 }} />
                            <TaskList
                                tasks={section.completedTasks}
                                user={user}
                                cohort={cohort}
                                isFreeTier={isFreeTier}
                                isCurrentUser={isCurrentUser}
                                togglePin={togglePin}
                                pinnedTasks={pinnedTasks}
                            />
                        </>
                    ) : (
                        <>
                            <Button sx={{ my: 2 }} onClick={() => setShowCompleted(true)}>
                                Show {section.completedTasks.length} completed task
                                {section.completedTasks.length !== 1 && 's'}
                            </Button>
                            <Divider />
                        </>
                    ))}

                {!isFreeTier && isCustomTaskCategory(section.category) && isCurrentUser && (
                    <Button sx={{ mt: 2 }} onClick={() => setShowCustomTaskEditor(true)}>
                        Add Custom Task
                    </Button>
                )}

                {isFreeTier &&
                    section.category !== RequirementCategory.NonDojo &&
                    hiddenTaskCount > 0 && (
                        <Stack mt={2} spacing={2} alignItems='center'>
                            <Typography>
                                Unlock {hiddenTaskCount} more task
                                {hiddenTaskCount > 1 ? 's' : ''} by upgrading to a full account
                            </Typography>
                            <Button variant='outlined' href='/prices'>
                                View Prices
                            </Button>
                        </Stack>
                    )}
            </AccordionDetails>

            <CustomTaskEditor
                open={showCustomTaskEditor}
                onClose={() => setShowCustomTaskEditor(false)}
                initialCategory={section.category as unknown as CustomTaskCategory}
            />
        </Accordion>
    );
}

function TaskList({
    tasks,
    isFreeTier,
    user,
    cohort,
    isCurrentUser,
    togglePin,
    pinnedTasks,
}: {
    tasks: (Requirement | CustomTask)[];
    isFreeTier: boolean;
    user: User;
    cohort: string;
    isCurrentUser: boolean;
    /** A callback invoked when the user toggles a pinned task. */
    togglePin: (req: Requirement | CustomTask) => void;
    /** The set of pinned tasks. */
    pinnedTasks: (Requirement | CustomTask)[];
}) {
    return (
        <>
            {tasks.map((r) => {
                if (r.id === SCHEDULE_CLASSICAL_GAME_TASK_ID) {
                    return <ScheduleClassicalGame key={r.id} hideChip />;
                }
                if (isFreeTier && isRequirement(r) && !r.isFree) {
                    return null;
                }
                return (
                    <FullTrainingPlanItem
                        key={r.id}
                        requirement={r}
                        progress={user.progress[r.id]}
                        cohort={cohort}
                        isCurrentUser={isCurrentUser}
                        user={user}
                        togglePin={togglePin}
                        isPinned={pinnedTasks.some((t) => t.id === r.id)}
                    />
                );
            })}
        </>
    );
}
