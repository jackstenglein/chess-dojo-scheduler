import { useFreeTier } from '@/auth/Auth';
import { TrainingTipsButton } from '@/components/profile/TrainingTips';
import DojoScoreCard from '@/components/profile/stats/DojoScoreCard';
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
import { RequestSnackbar } from '../../api/Request';
import { useRequirements } from '../../api/cache/requirements';
import {
    CustomTask,
    Requirement,
    RequirementCategory,
    isBlocked,
    isComplete,
} from '../../database/requirement';
import { ALL_COHORTS, User, dojoCohorts } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import CohortIcon from '../../scoreboard/CohortIcon';
import ProgressCategory, { Category } from './ProgressCategory';

function useHideCompleted(isCurrentUser: boolean) {
    const myProfile = useLocalStorage('hideCompletedTasks2', false);
    const otherProfile = useState(false);

    if (isCurrentUser) {
        return myProfile;
    }
    return otherProfile;
}

interface ProgressTabProps {
    user: User;
    isCurrentUser: boolean;
}

const ProgressTab: React.FC<ProgressTabProps> = ({ user, isCurrentUser }) => {
    const [cohort, setCohort] = useState(user.dojoCohort);
    const { request: requirementRequest } = useRequirements(ALL_COHORTS, false);
    const { requirements } = useRequirements(cohort, false);
    const [hideCompleted, setHideCompleted] = useHideCompleted(isCurrentUser);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'Welcome to the Dojo': false,
        'Games + Analysis': false,
        Tactics: false,
        'Middlegames + Strategy': false,
        Endgame: false,
        Opening: false,
        'Non-Dojo': false,
        [RequirementCategory.SuggestedTasks]: true,
    });
    const isFreeTier = useFreeTier();

    useEffect(() => {
        setCohort(user.dojoCohort);
    }, [user.dojoCohort]);

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
                    requirements: complete && hideCompleted ? [] : [task],
                    totalComplete: complete ? 1 : 0,
                    totalRequirements: 1,
                });
            } else {
                c.totalRequirements++;
                if (!complete || !hideCompleted) {
                    c.requirements.push(task);
                }
                if (complete) {
                    c.totalComplete++;
                }
            }
        });
        return categories;
    }, [requirements, user, cohort, hideCompleted]);

    const suggestedTasks: Category = useMemo(() => {
        const suggestedTasks: Category = {
            name: RequirementCategory.SuggestedTasks,
            requirements: [],
            totalComplete: 0,
            totalRequirements: 0,
        };

        const desiredTaskCount = 3;

        const requirementsById = Object.fromEntries(requirements.map((r) => [r.id, r]));

        const recentRequirements = Object.values(user.progress)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((progress) => requirementsById[progress.requirementId])
            .filter(
                (r) =>
                    !!r &&
                    !isComplete(cohort, r, user.progress[r.id]) &&
                    r.category !== RequirementCategory.NonDojo,
            );

        suggestedTasks.requirements = recentRequirements.slice(0, desiredTaskCount - 1);

        const now = new Date();
        const daysSinceEpoch = Math.floor(now.getTime() / 8.64e7);
        const categoryOffset = daysSinceEpoch % categories.length;

        const categoriesOfInterest: RequirementCategory[] = [
            ...categories.slice(categoryOffset),
            ...categories.slice(0, categoryOffset),
        ]
            .map((c) => c.name)
            .filter((c) => c !== RequirementCategory.NonDojo);

        const tasksOfInterest = requirements.filter(
            (r) =>
                ((isFreeTier && r.isFree) || !isFreeTier) &&
                !isComplete(cohort, r, user.progress[r.id]) &&
                categoriesOfInterest.includes(r.category) &&
                !isBlocked(cohort, user, r, requirements).isBlocked &&
                suggestedTasks.requirements.findIndex((recent) => recent.id === r.id) < 0,
        );

        const tasksByCategory = tasksOfInterest.reduce<Record<string, Requirement[]>>(
            (acc, req) => {
                acc[req.category] ??= [];
                acc[req.category].push(req);

                return acc;
            },
            {},
        );

        // Once per task we need, get one task of each category
        const moreTasks = [
            ...Array(desiredTaskCount - suggestedTasks.requirements.length).keys(),
        ].flatMap((n) =>
            categoriesOfInterest
                .map((c) => tasksByCategory[c] ?? [])
                .filter((tasks) => tasks.length > 0)
                .flatMap((tasks) => tasks[(daysSinceEpoch + n) % tasks.length]),
        );

        // Fill the remaining suggest tasks slots with tasks that rotate day by day.
        suggestedTasks.requirements = [
            ...suggestedTasks.requirements,
            ...moreTasks,
        ].slice(0, desiredTaskCount);

        suggestedTasks.totalRequirements = suggestedTasks.requirements.length;

        return suggestedTasks;
    }, [categories, isFreeTier, user, cohort, requirements]);

    if (requirementRequest.isLoading() || categories.length === 0) {
        return <LoadingPage />;
    }

    const onChangeCohort = (cohort: string) => {
        setCohort(cohort);
    };

    const toggleExpand = (category: string) => {
        setExpanded({
            ...expanded,
            [category]: !expanded[category],
        });
    };

    const onExpandAll = () => {
        setExpanded({
            'Welcome to the Dojo': true,
            'Games + Analysis': true,
            Tactics: true,
            'Middlegames + Strategy': true,
            Endgame: true,
            Opening: true,
            'Non-Dojo': true,
            [RequirementCategory.SuggestedTasks]: true,
        });
    };

    const onCollapseAll = () => {
        setExpanded({
            'Welcome to the Dojo': false,
            'Games + Analysis': false,
            Tactics: false,
            'Middlegames + Strategy': false,
            Endgame: false,
            Opening: false,
            'Non-Dojo': false,
            [RequirementCategory.SuggestedTasks]: false,
        });
    };

    return (
        <Stack alignItems='start'>
            <RequestSnackbar request={requirementRequest} />

            <TextField
                id='training-plan-cohort-select'
                select
                label='Cohort'
                value={cohort}
                onChange={(event) => onChangeCohort(event.target.value)}
                sx={{ mb: 3 }}
                fullWidth
            >
                {dojoCohorts.map((option) => (
                    <MenuItem key={option} value={option}>
                        <CohortIcon
                            cohort={option}
                            sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                            tooltip=''
                        />{' '}
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            <DojoScoreCard user={user} cohort={cohort} />

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
                                checked={hideCompleted}
                                onChange={(e) => setHideCompleted(e.target.checked)}
                            />
                        }
                        label='Hide Completed Tasks'
                        slotProps={{
                            typography: { variant: 'body2', color: 'text.secondary' },
                        }}
                    />
                </FormGroup>
                <TrainingTipsButton />
                <Stack direction='row' spacing={1} justifyContent='end'>
                    <Button onClick={onExpandAll} startIcon={<KeyboardDoubleArrowDown />}>
                        Expand All
                    </Button>
                    <Button onClick={onCollapseAll} startIcon={<KeyboardDoubleArrowUp />}>
                        Collapse All
                    </Button>
                </Stack>
            </Stack>

            {suggestedTasks.requirements.length > 0 && (
                <ProgressCategory
                    color='dojoOrange'
                    key={suggestedTasks.name}
                    c={suggestedTasks}
                    expanded={expanded[suggestedTasks.name]}
                    toggleExpand={toggleExpand}
                    user={user}
                    isCurrentUser={isCurrentUser}
                    cohort={cohort}
                />
            )}

            {categories.map((c) => (
                <ProgressCategory
                    key={c.name}
                    c={c}
                    expanded={expanded[c.name]}
                    toggleExpand={toggleExpand}
                    user={user}
                    isCurrentUser={isCurrentUser}
                    cohort={cohort}
                />
            ))}
        </Stack>
    );
};

export default ProgressTab;
