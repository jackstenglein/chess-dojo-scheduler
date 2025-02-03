import { useApi } from '@/api/Api';
import { useAuth } from '@/auth/Auth';
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
    ANNOTATE_GAMES_TASK,
    CLASSICAL_GAMES_TASK,
    CustomTask,
    Requirement,
    RequirementCategory,
    getSuggestedTasks,
    isComplete,
} from '../../database/requirement';
import { ALL_COHORTS, User, dojoCohorts } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import CohortIcon from '../../scoreboard/CohortIcon';
import ProgressCategory, { Category } from './ProgressCategory';
import { isEligbleForBadge } from '@/components/profile/info/BadgeHandler';


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
    const { updateUser } = useAuth();
    const api = useApi();
    const [cohort, setCohort] = useState(user.dojoCohort);
    const { request: requirementRequest } = useRequirements(ALL_COHORTS, false);
    const { requirements } = useRequirements(cohort, false);
    console.log(requirements)
    console.log(user)
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

    useEffect(() => {
        setCohort(user.dojoCohort);
    }, [user.dojoCohort]);

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
        const suggestedTasks = getSuggestedTasks(pinnedTasks, requirements, user);
        if (suggestedTasks.length > 0) {
            categories.push({
                name: RequirementCategory.SuggestedTasks,
                requirements: suggestedTasks,
                totalComplete: 0,
                totalRequirements: suggestedTasks.length,
                color: 'dojoOrange',
            });
        }

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
    }, [requirements, user, cohort, hideCompleted, pinnedTasks]);

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

    const togglePin = (task: Requirement | CustomTask) => {
        const isPinned = pinnedTasks.some((t) => t.id === task.id);
        const newPinnedTasks = isPinned
            ? pinnedTasks.filter((t) => t.id !== task.id)
            : [...pinnedTasks, task];
        const newIds = newPinnedTasks.map((t) => t.id);

        updateUser({ pinnedTasks: newIds });
        api.updateUser({ pinnedTasks: newIds }).catch(console.error);
    };

<<<<<<< HEAD
    console.log(isEligbleForBadge(user, ANNOTATE_GAMES_TASK, 75, requirements))
    console.log(isEligbleForBadge(user, CLASSICAL_GAMES_TASK, 80, requirements))
=======
    // console.log(isEligbleForBadge(user, ANNOTATE_GAMES_TASK, 75, requirements))
    // console.log(isEligbleForBadge(user, CLASSICAL_GAMES_TASK, 80, requirements))
>>>>>>> b5032b42 (fix(badges): add viewing badge ability when eligible)

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
};

export default ProgressTab;
