import {
    Stack,
    Typography,
    FormControlLabel,
    Checkbox,
    FormHelperText,
    FormControl,
} from '@mui/material';

import { dojoCohorts } from '../../../database/user';

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
    return (
        <Stack>
            <Typography variant='h6'>Cohorts</Typography>
            <Typography variant='subtitle1' color='text.secondary'>
                {description}
            </Typography>

            <FormControl error={!!error}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={allCohorts}
                            onChange={(event) => setAllCohorts(event.target.checked)}
                        />
                    }
                    label='All Cohorts'
                />
                <Stack direction='row' sx={{ flexWrap: 'wrap', columnGap: 2.5 }}>
                    {dojoCohorts.map((cohort) => (
                        <FormControlLabel
                            key={cohort}
                            control={
                                <Checkbox
                                    data-cy={`cohort-checkbox-${cohort}`}
                                    checked={allCohorts || cohorts[cohort]}
                                    onChange={(event) =>
                                        setCohort(cohort, event.target.checked)
                                    }
                                />
                            }
                            disabled={allCohorts}
                            label={cohort}
                        />
                    ))}
                </Stack>
                <FormHelperText>{error}</FormHelperText>
            </FormControl>
        </Stack>
    );
};

export default CohortsFormSection;
