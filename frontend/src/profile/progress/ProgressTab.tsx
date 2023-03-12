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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { compareRequirements, isComplete, Requirement } from '../../database/requirement';
import { dojoCohorts, User } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import ProgressItem from './ProgressItem';
import { Graduation } from '../../database/graduation';
import GraduationIcon from '../../scoreboard/GraduationIcon';

interface Category {
    name: string;
    requirements: Requirement[];
    totalComplete: number;
}

interface ProgressTabProps {
    user: User;
    isCurrentUser: boolean;
}

const ProgressTab: React.FC<ProgressTabProps> = ({ user, isCurrentUser }) => {
    const api = useApi();
    const request = useRequest<Requirement[]>();
    const graduationsRequest = useRequest<Graduation[]>();
    const [cohort, setCohort] = useState(user.dojoCohort);

    const reset = request.reset;
    useEffect(() => {
        setCohort(user.dojoCohort);
        reset();
    }, [user.dojoCohort, reset]);

    useEffect(() => {
        if (!request.isSent()) {
            api.listRequirements(cohort, false)
                .then((requirements) => {
                    request.onSuccess(requirements);
                    console.log('requirements: ', requirements);
                })
                .catch((err) => {
                    console.error('listRequirements: ', err);
                    request.onFailure(err);
                });
        }
        if (!graduationsRequest.isSent()) {
            graduationsRequest.onStart();
            api.listGraduationsByOwner(user.username)
                .then((graduations) => graduationsRequest.onSuccess(graduations))
                .catch((err) => {
                    console.error('listGraduationsByOwner: ', err);
                    graduationsRequest.onFailure(err);
                });
        }
    }, [request, api, cohort, graduationsRequest, user.username]);

    const requirements = useMemo(() => {
        return [...(request.data ?? [])].sort(compareRequirements);
    }, [request.data]);

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
        return categories;
    }, [requirements, user, cohort]);

    if (request.isLoading() || categories.length === 0) {
        return <LoadingPage />;
    }

    const onChangeCohort = (cohort: string) => {
        setCohort(cohort);
        request.reset();
    };

    return (
        <Stack alignItems='start'>
            <RequestSnackbar request={request} />

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

            {graduationsRequest.data?.some((g) => g.previousCohort === cohort) && (
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
            )}

            {categories.map((c) => (
                <Accordion key={c.name} sx={{ width: 1 }}>
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
                            <Typography color='text.secondary'>
                                {`${c.totalComplete}/${c.requirements.length} steps`}
                            </Typography>
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
                    </AccordionDetails>
                </Accordion>
            ))}
        </Stack>
    );
};

export default ProgressTab;
