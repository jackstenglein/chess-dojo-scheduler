import { useState } from 'react';
import { Stepper, Step, StepLabel, Typography, Container, Box } from '@mui/material';

import { User, dojoCohorts } from '../../database/user';
import PersonalInfoForm from './PersonalInfoForm';
import { useAuth } from '../../auth/Auth';
import PreferredRatingSystemForm from './PreferredRatingSystemForm';
import ExtraRatingSystemsForm from './ExtraRatingSystemsForm';
import DiscordForm from './DiscordForm';

interface StepProps {
    label: string;
    optional: boolean;
    form: React.FC<ProfileCreatorFormProps>;
}

export interface ProfileCreatorFormProps {
    user: User;
    onNextStep: () => void;
    onPrevStep: () => void;
}

const steps: StepProps[] = [
    {
        label: 'Personal Information',
        optional: false,
        form: PersonalInfoForm,
    },
    {
        label: 'Dojo Cohort',
        optional: false,
        form: PreferredRatingSystemForm,
    },
    {
        label: 'Extra Rating Systems',
        optional: true,
        form: ExtraRatingSystemsForm,
    },
    {
        label: 'Discord',
        optional: true,
        form: DiscordForm,
    },
];

function getActiveStep(user: User): number {
    if (user.displayName.trim() === '') {
        return 0;
    }
    if (
        user.dojoCohort === '' ||
        user.dojoCohort === 'NO_COHORT' ||
        (user.ratingSystem as string) === '' ||
        !dojoCohorts.includes(user.dojoCohort)
    ) {
        return 1;
    }
    return 2;
}

const ProfileCreatorPage = () => {
    const user = useAuth().user!;
    const [activeStep, setActiveStep] = useState(getActiveStep(user));

    const Form = steps[activeStep].form;

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Typography variant='h6'>Create Profile</Typography>
            <Stepper activeStep={activeStep}>
                {steps.map((s) => (
                    <Step key={s.label}>
                        <StepLabel
                            optional={
                                s.optional && (
                                    <Typography variant='caption'>Optional</Typography>
                                )
                            }
                        >
                            {s.label}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
            <Box mt={5}>
                <Form
                    user={user}
                    onNextStep={() => setActiveStep(activeStep + 1)}
                    onPrevStep={() => setActiveStep(activeStep - 1)}
                />
            </Box>
        </Container>
    );
};

export default ProfileCreatorPage;
