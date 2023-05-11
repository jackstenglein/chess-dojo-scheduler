import { useEffect, useMemo, useState } from 'react';
import {
    Stack,
    Accordion,
    AccordionSummary,
    Typography,
    AccordionDetails,
    Divider,
    TextField,
    MenuItem,
    Chip,
    Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { CustomTask, isComplete, Requirement } from '../../database/requirement';
import { dojoCohorts, User } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import ProgressItem from './ProgressItem';
import { Graduation } from '../../database/graduation';
import GraduationIcon from '../../scoreboard/GraduationIcon';
import { useRequirements } from '../../api/cache/requirements';
import GraduationChips from '../../scoreboard/GraduationChips';
import CustomTaskEditor from './CustomTaskEditor';

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
    }, [requirements, user, cohort]);

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

            {graduationsRequest.data?.some((g) => g.previousCohort === cohort) ? (
                <Chip
                    variant='filled'
                    color='success'
                    label='Graduated'
                    sx={{ mb: 3 }}
                    icon={
                        <GraduationIcon
                            cohort={cohort}
                            size={24}
                            sx={{ marginLeft: '4px', marginRight: '-6px' }}
                        />
                    }
                />
            ) : (
                <GraduationChips cohort={cohort} />
            )}

            <Stack direction='row' spacing={1} width={1} justifyContent='end'>
                <Button onClick={onExpandAll}>Expand All</Button>
                <Button onClick={onCollapseAll}>Collapse All</Button>
            </Stack>

            {categories.map((c) => (
                <Accordion
                    key={c.name}
                    expanded={expanded[c.name]}
                    onChange={() => toggleExpand(c.name)}
                    sx={{ width: 1 }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={`${c.name}-content`}
                        id={`${c.name}-header`}
                    >
                        <Stack
                            direction='row'
                            justifyContent='space-between'
                            sx={{ width: 1, mr: 2 }}
                        >
                            <Typography fontWeight='bold'>{c.name}</Typography>
                            {c.name === 'Non-Dojo' ? (
                                <Typography color='text.secondary'>
                                    {c.requirements.length} activities
                                </Typography>
                            ) : (
                                <Typography color='text.secondary'>
                                    {`${c.totalComplete}/${c.requirements.length} steps`}
                                </Typography>
                            )}
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Divider />
                        {c.requirements.map((r) => (
                            <ProgressItem
                                key={r.id}
                                requirement={r}
                                progress={user.progress[r.id]}
                                cohort={cohort}
                                isCurrentUser={isCurrentUser}
                            />
                        ))}
                        {c.name === 'Non-Dojo' && isCurrentUser && (
                            <Button
                                sx={{ mt: 2 }}
                                onClick={() => setShowCustomTaskEditor(true)}
                            >
                                Add Custom Activity
                            </Button>
                        )}
                    </AccordionDetails>
                </Accordion>
            ))}

            <CustomTaskEditor
                open={showCustomTaskEditor}
                onClose={() => setShowCustomTaskEditor(false)}
            />
        </Stack>
    );
};

export default ProgressTab;
