import { RequestSnackbar } from '@/api/Request';
import { CustomTask, isComplete, Requirement, RequirementCategory } from '@/database/requirement';
import { dojoCohorts, User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import CohortIcon from '@/scoreboard/CohortIcon';
import { KeyboardDoubleArrowDown, KeyboardDoubleArrowUp } from '@mui/icons-material';
import {
    Button,
    Checkbox,
    FormControlLabel,
    FormGroup,
    MenuItem,
    Stack,
    TextField,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useTimelineContext } from '../../activity/useTimeline';
import { getUpcomingGameSchedule, SCHEDULE_CLASSICAL_GAME_TASK_ID } from '../suggestedTasks';
import { useTrainingPlan } from '../useTrainingPlan';
import { Section, TrainingPlanSection } from './TrainingPlanSection';

/** Renders the full training plan view of the training plan tab. */
export function FullTrainingPlan({ user }: { user: User }) {
    const { entries: timeline } = useTimelineContext();
    const [cohort, setCohort] = useState(user.dojoCohort);
    const {
        request: requirementRequest,
        requirements,
        pinnedTasks,
        togglePin,
        isCurrentUser,
    } = useTrainingPlan(user, cohort);
    const [showCompleted, setShowCompleted] = useShowCompleted(isCurrentUser);

    const [expanded, setExpanded] = useState<Partial<Record<RequirementCategory, boolean>>>({
        [RequirementCategory.Pinned]: true,
        [RequirementCategory.Welcome]: false,
        [RequirementCategory.Games]: false,
        [RequirementCategory.Tactics]: false,
        [RequirementCategory.Middlegames]: false,
        [RequirementCategory.Endgame]: false,
        [RequirementCategory.Opening]: false,
        [RequirementCategory.NonDojo]: false,
    });

    useEffect(() => {
        setCohort(user.dojoCohort);
    }, [user.dojoCohort, setCohort]);

    const sections: Section[] = useMemo(() => {
        const sections: Section[] = [];

        if (pinnedTasks.length > 0) {
            const uncompletedTasks = [];
            const completedTasks = [];

            for (const task of pinnedTasks) {
                if (isComplete(cohort, task, user.progress[task.id], timeline, true)) {
                    completedTasks.push(task);
                } else {
                    uncompletedTasks.push(task);
                }
            }

            sections.push({
                category: RequirementCategory.Pinned,
                uncompletedTasks: uncompletedTasks,
                completedTasks,
            });
        }

        const tasks = (requirements as (Requirement | CustomTask)[]).concat(user.customTasks ?? []);
        for (const task of tasks) {
            if (task.counts[cohort] === undefined) {
                continue;
            }

            const s = sections.find((s) => s.category === task.category);
            const complete =
                task.id !== SCHEDULE_CLASSICAL_GAME_TASK_ID
                    ? isComplete(cohort, task, user.progress[task.id], timeline, false)
                    : getUpcomingGameSchedule(user.gameSchedule).length > 0;

            if (s === undefined) {
                sections.push({
                    category: task.category,
                    uncompletedTasks: complete ? [] : [task],
                    completedTasks: complete ? [task] : [],
                });
            } else if (complete) {
                s.completedTasks.push(task);
            } else {
                s.uncompletedTasks.push(task);
            }
        }

        return sections;
    }, [requirements, user, cohort, pinnedTasks, timeline]);

    if (requirementRequest.isLoading() || sections.length === 0) {
        return <LoadingPage />;
    }

    const onChangeCohort = (cohort: string) => {
        setCohort(cohort);
    };

    const toggleExpand = (category: RequirementCategory) => {
        setExpanded({
            ...expanded,
            [category]: !expanded[category],
        });
    };

    const onExpandAll = () => {
        setExpanded((c) =>
            Object.keys(c).reduce<Record<string, boolean>>((acc, cat) => {
                acc[cat as RequirementCategory] = true;
                return acc;
            }, {}),
        );
    };

    const onCollapseAll = () => {
        setExpanded((c) =>
            Object.keys(c).reduce<Record<string, boolean>>((acc, cat) => {
                acc[cat as RequirementCategory] = false;
                return acc;
            }, {}),
        );
    };

    return (
        <Stack alignItems='start' width={1}>
            <RequestSnackbar request={requirementRequest} />

            <TextField
                id='training-plan-cohort-select'
                select
                label='Cohort'
                value={cohort}
                onChange={(event) => onChangeCohort(event.target.value)}
                fullWidth
                sx={{ mt: 1.5 }}
            >
                {dojoCohorts.map((option) => (
                    <MenuItem key={option} value={option}>
                        <CohortIcon
                            cohort={option}
                            sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                            tooltip=''
                            size={30}
                        />{' '}
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            <Stack
                direction='row'
                justifyContent='space-between'
                width={1}
                flexWrap='wrap'
                alignItems='end'
                mt={3}
                mb={expanded[sections[0].category] ? -2 : 0}
            >
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Checkbox
                                size='small'
                                checked={showCompleted}
                                onChange={(e) => setShowCompleted(e.target.checked)}
                            />
                        }
                        label='Show Completed Tasks'
                        slotProps={{
                            typography: { variant: 'body2', color: 'text.secondary' },
                        }}
                    />
                </FormGroup>

                <Stack direction='row' spacing={1} justifyContent='end'>
                    <Button onClick={onExpandAll} startIcon={<KeyboardDoubleArrowDown />}>
                        Expand All
                    </Button>
                    <Button onClick={onCollapseAll} startIcon={<KeyboardDoubleArrowUp />}>
                        Collapse All
                    </Button>
                </Stack>
            </Stack>

            {sections.map((section) => (
                <TrainingPlanSection
                    key={section.category}
                    section={section}
                    expanded={expanded[section.category]}
                    toggleExpand={toggleExpand}
                    user={user}
                    isCurrentUser={isCurrentUser}
                    cohort={cohort}
                    togglePin={togglePin}
                    pinnedTasks={pinnedTasks}
                />
            ))}
        </Stack>
    );
}

export function useShowCompleted(isCurrentUser: boolean) {
    const myProfile = useLocalStorage('showCompletedTasks', false);
    const otherProfile = useState(false);

    if (isCurrentUser) {
        return myProfile;
    }
    return otherProfile;
}
