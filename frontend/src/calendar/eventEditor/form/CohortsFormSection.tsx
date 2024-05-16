import { Stack, Typography } from '@mui/material';
import { ALL_COHORTS, dojoCohorts } from '../../../database/user';
import MultipleSelectChip from '../../../newsfeed/list/MultipleSelectChip';
import CohortIcon from '../../../scoreboard/CohortIcon';
import Icon from '../../../style/Icon';

interface CohortsFormSectionProps {
    description: string;
    allCohorts: boolean;
    setAllCohorts: (value: boolean) => void;
    cohorts: Record<string, boolean>;
    setCohort: (cohort: string, value: boolean) => void;
    error?: string;
}

const CohortsFormSection: React.FC<CohortsFormSectionProps> = ({
    description,
    allCohorts,
    setAllCohorts,
    cohorts,
    setCohort,
    error,
}) => {
    const selectedCohorts = allCohorts
        ? [ALL_COHORTS]
        : Object.keys(cohorts).filter((c) => cohorts[c]);

    const onChangeCohort = (newCohorts: string[]) => {
        const addedCohorts = newCohorts.filter((c) => !selectedCohorts.includes(c));
        if (addedCohorts.includes(ALL_COHORTS)) {
            setAllCohorts(true);
            dojoCohorts.forEach((c) => setCohort(c, false));
        } else {
            setAllCohorts(false);
            dojoCohorts.forEach((c) => setCohort(c, false));
            newCohorts.forEach((c) => {
                if (c !== ALL_COHORTS) {
                    setCohort(c, true);
                }
            });
        }
    };

    return (
        <Stack data-cy='cohort-section'>
            <Typography variant='h6'>
                <Icon
                    name='cohort'
                    color='primary'
                    sx={{ marginRight: '0.4rem', verticalAlign: 'middle' }}
                    fontSize='medium'
                />
                Cohorts
            </Typography>
            <Typography variant='subtitle1' color='text.secondary' mb={0.5}>
                {description}
            </Typography>

            <MultipleSelectChip
                selected={selectedCohorts}
                setSelected={onChangeCohort}
                options={[ALL_COHORTS, ...dojoCohorts].map((opt) => ({
                    value: opt,
                    label: opt === ALL_COHORTS ? 'All Cohorts' : opt,
                    icon: (
                        <CohortIcon
                            cohort={opt}
                            size={25}
                            sx={{ marginRight: '0.6rem' }}
                            tooltip=''
                            color='primary'
                        />
                    ),
                }))}
                sx={{ mb: 3, width: 1 }}
                errorHelper={error}
                data-cy='cohort-selector'
            />
        </Stack>
    );
};

export default CohortsFormSection;
