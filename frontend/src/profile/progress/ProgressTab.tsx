import { useEffect, useMemo, useState } from 'react';
import {
    Stack,
    TextField,
    MenuItem,
    Button,
    FormGroup,
    FormControlLabel,
    Checkbox,
} from '@mui/material';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { CustomTask, isComplete, Requirement } from '../../database/requirement';
import { dojoCohorts, User } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import { Graduation } from '../../database/graduation';
import { useRequirements } from '../../api/cache/requirements';
import CustomTaskEditor from './CustomTaskEditor';
import DojoScoreCard from '../stats/DojoScoreCard';
import ProgressCategory from './ProgressCategory';

interface Category {
    name: string;
    requirements: Array<Requirement | CustomTask>;
    totalComplete: number;
}

interface ProgressTabProps {
    user: User;
    isCurrentUser: boolean;
}

const ProgressTab: React.FC<ProgressTabProps> = ({ user, isCurrentUser }) => {
    const api = useApi();
    const graduationsRequest = useRequest<Graduation[]>();
    const [cohort, setCohort] = useState(user.dojoCohort);
    const { requirements, request: requirementRequest } = useRequirements(cohort, false);
    const [hideCompleted, setHideCompleted] = useState(false);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'Welcome to the Dojo': false,
        'Games + Analysis': false,
        Tactics: false,
        'Middlegames + Strategy': false,
        Endgame: false,
        Opening: false,
        'Non-Dojo': false,
    });
    const [showCustomTaskEditor, setShowCustomTaskEditor] = useState(false);

    useEffect(() => {
        setCohort(user.dojoCohort);
    }, [user.dojoCohort]);

    useEffect(() => {
        if (!graduationsRequest.isSent()) {
            graduationsRequest.onStart();
            api.listGraduationsByOwner(user.username)
                .then((graduations) => graduationsRequest.onSuccess(graduations))
                .catch((err) => {
                    console.error('listGraduationsByOwner: ', err);
                    graduationsRequest.onFailure(err);
                });
        }
    }, [api, cohort, graduationsRequest, user.username]);

    const categories = useMemo(() => {
        const categories: Category[] = [];
        requirements?.forEach((r) => {
            const c = categories.find((c) => c.name === r.category);
            const complete = isComplete(cohort, r, user.progress[r.id]);
            if (complete && hideCompleted) {
                return;
            }

            if (c === undefined) {
                categories.push({
                    name: r.category,
                    requirements: [r],
                    totalComplete: complete ? 1 : 0,
                });
            } else {
                c.requirements.push(r);
                if (complete) {
                    c.totalComplete++;
                }
            }
        });
        user.customTasks?.forEach((task) => {
            if (task.counts[cohort]) {
                const c = categories.find((c) => c.name === 'Non-Dojo');
                if (c === undefined) {
                    categories.push({
                        name: 'Non-Dojo',
                        requirements: [task],
                        totalComplete: 0,
                    });
                } else {
                    c.requirements.push(task);
                }
            }
        });
        return categories;
    }, [requirements, user, cohort, hideCompleted]);

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
                <Stack direction='row' spacing={1} justifyContent='end'>
                    <Button onClick={onExpandAll}>Expand All</Button>
                    <Button onClick={onCollapseAll}>Collapse All</Button>
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
                    setShowCustomTaskEditor={setShowCustomTaskEditor}
                />
            ))}

            <CustomTaskEditor
                open={showCustomTaskEditor}
                onClose={() => setShowCustomTaskEditor(false)}
            />
        </Stack>
    );
};

export default ProgressTab;
