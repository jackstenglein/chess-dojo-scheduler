import { useApi } from '@/api/Api';
import { useRequirements } from '@/api/cache/requirements';
import { RequestSnackbar } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import {
    CustomTask,
    isComplete,
    Requirement,
    RequirementCategory,
} from '@/database/requirement';
import { ALL_COHORTS, dojoCohorts, User } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import ProgressCategory, { Category } from '@/profile/progress/ProgressCategory';
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

/** Renders the full training plan view of the training plan tab. */
export function FullTrainingPlan({
    user,
    isCurrentUser,
}: {
    user: User;
    isCurrentUser: boolean;
}) {
    const { updateUser } = useAuth();
    const api = useApi();
    const [cohort, setCohort] = useState(user.dojoCohort);
    const { request: requirementRequest } = useRequirements(ALL_COHORTS, false);
    const { requirements } = useRequirements(cohort, false);
    const [showCompleted, setShowCompleted] = useShowCompleted(isCurrentUser);

    const [expanded, setExpanded] = useState<
        Partial<Record<RequirementCategory, boolean>>
    >({
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

    const pinnedTasks = useMemo(() => {
        return (
            user.pinnedTasks
                ?.map(
                    (id) =>
                        user.customTasks?.find((task) => task.id === id) ||
                        requirements.find((task) => task.id === id),
                )
                .filter((t) => !!t) ?? []
        );
    }, [user, requirements]);

    const categories: Category[] = useMemo(() => {
        const categories: Category[] = [];

        const tasks = (requirements as (Requirement | CustomTask)[]).concat(
            user.customTasks ?? [],
        );
        tasks.forEach((task) => {
            if (!(cohort in task.counts)) {
                return;
            }

            const c = categories.find((c) => c.name === task.category);
            const complete = isComplete(cohort, task, user.progress[task.id]);

            if (c === undefined) {
                categories.push({
                    name: task.category,
                    requirements: complete && showCompleted ? [task] : [],
                    totalComplete: complete ? 1 : 0,
                    totalRequirements: 1,
                });
            } else {
                c.totalRequirements++;
                if (!complete || showCompleted) {
                    c.requirements.push(task);
                }
                if (complete) {
                    c.totalComplete++;
                }
            }
        });
        return categories;
    }, [requirements, user, cohort, showCompleted]);

    if (requirementRequest.isLoading() || categories.length === 0) {
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
            Object.keys(c).reduce<Partial<Record<RequirementCategory, boolean>>>(
                (acc, cat) => {
                    acc[cat as RequirementCategory] = true;
                    return acc;
                },
                {},
            ),
        );
    };

    const onCollapseAll = () => {
        setExpanded((c) =>
            Object.keys(c).reduce<Partial<Record<RequirementCategory, boolean>>>(
                (acc, cat) => {
                    acc[cat as RequirementCategory] = false;
                    return acc;
                },
                {},
            ),
        );
    };

    const togglePin = (task: Requirement | CustomTask) => {
        const isPinned = pinnedTasks.some((t) => t.id === task.id);
        const newPinnedTasks = isPinned
            ? pinnedTasks.filter((t) => t.id !== task.id)
            : [...pinnedTasks, task];
        const newIds = newPinnedTasks.map((t) => t.id);

        updateUser({ pinnedTasks: newIds });
        api.updateUser({ pinnedTasks: newIds }).catch(console.error);
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

            {categories.map((c) => (
                <ProgressCategory
                    key={c.name}
                    c={c}
                    expanded={expanded[c.name]}
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
