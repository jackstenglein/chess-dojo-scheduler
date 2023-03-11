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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { compareRequirements, isComplete, Requirement } from '../database/requirement';
import { dojoCohorts, User } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import ProgressItem from './ProgressItem';

interface Category {
    name: string;
    requirements: Requirement[];
    totalComplete: number;
}

interface ProgressTabProps {
    user: User;
}

const ProgressTab: React.FC<ProgressTabProps> = ({ user }) => {
    const api = useApi();
    const request = useRequest<Requirement[]>();
    const [cohort, setCohort] = useState(user.dojoCohort);

    useEffect(() => {
        if (!request.isSent()) {
            api.listRequirements(cohort, false)
                .then((requirements) => {
                    request.onSuccess(requirements);
                })
                .catch((err) => {
                    console.error('listRequirements: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api, cohort]);

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
        <Stack>
            <RequestSnackbar request={request} />

            <TextField
                select
                label='Cohort'
                value={cohort}
                onChange={(event) => onChangeCohort(event.target.value)}
                sx={{ mb: 3 }}
            >
                {dojoCohorts.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            {categories.map((c) => (
                <Accordion key={c.name}>
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
                            />
                        ))}
                    </AccordionDetails>
                </Accordion>
            ))}
        </Stack>
    );
};

export default ProgressTab;
