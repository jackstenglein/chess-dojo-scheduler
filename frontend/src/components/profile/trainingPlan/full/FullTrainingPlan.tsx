import { RequestSnackbar } from '@/api/Request';
import {
    CustomTask,
    isComplete,
    Requirement,
    RequirementCategory,
} from '@/database/requirement';
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
import { Section, TrainingPlanSection } from '../TrainingPlanSection';
import { useTrainingPlan } from '../useTrainingPlan';

/** Renders the full training plan view of the training plan tab. */
export function FullTrainingPlan({ user }: { user: User }) {
    const [cohort, setCohort] = useState(user.dojoCohort);
    const {
        request: requirementRequest,
        requirements,
        pinnedTasks,
        togglePin,
        isCurrentUser,
    } = useTrainingPlan(user, cohort);
    const [showCompleted, setShowCompleted] = useShowCompleted(isCurrentUser);

    const [expanded, setExpanded] = useState<
        Partial<Record<RequirementCategory, boolean>>
    >({
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
            const uncompletedTasks = pinnedTasks.filter(
                (t) => !isComplete(cohort, t, user.progress[t.id]),
            );
            sections.push({
                category: RequirementCategory.Pinned,
                tasks: showCompleted ? pinnedTasks : uncompletedTasks,
                complete: pinnedTasks.length - uncompletedTasks.length,
                total: pinnedTasks.length,
            });
        }

        const tasks = (requirements as (Requirement | CustomTask)[]).concat(
            user.customTasks ?? [],
        );
        tasks.forEach((task) => {
            if (!(cohort in task.counts)) {
                return;
            }

            const s = sections.find((s) => s.category === task.category);
            const complete = isComplete(cohort, task, user.progress[task.id]);

            if (s === undefined) {
                sections.push({
                    category: task.category,
                    tasks: complete && showCompleted ? [task] : [],
                    complete: complete ? 1 : 0,
                    total: 1,
                });
            } else {
                s.total++;
                if (complete) {
                    s.complete++;
                }
                if (!complete || showCompleted) {
                    s.tasks.push(task);
                }
            }
        });
        return sections;
    }, [requirements, user, cohort, showCompleted, pinnedTasks]);

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

function useShowCompleted(isCurrentUser: boolean) {
    const myProfile = useLocalStorage('showCompletedTasks', false);
    const otherProfile = useState(false);

    if (isCurrentUser) {
        return myProfile;
    }
    return otherProfile;
}
