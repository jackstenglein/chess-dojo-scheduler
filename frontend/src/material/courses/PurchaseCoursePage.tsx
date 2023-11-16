import { Container, Stack, Typography, Divider, Alert, Button } from '@mui/material';

import { Course } from '../../database/course';
import { useAuth, useFreeTier } from '../../auth/Auth';
import BuyButton from './BuyButton';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import UpsellAlert from '../../upsell/UpsellAlert';

interface PurchaseCoursePageProps {
    course?: Course;
}

const PurchaseCoursePage: React.FC<PurchaseCoursePageProps> = ({ course }) => {
    const user = useAuth().user!;
    const isFreeTier = useFreeTier();

    if (!course) {
        return null;
    }

    return (
        <Container maxWidth={false} sx={{ pt: 6, pb: 4 }}>
            <Stack>
                <Typography variant='h4'>{course.name}</Typography>
                <Typography variant='h5' color='text.secondary'>
                    {course.cohortRange}
                </Typography>
                <Divider />

                <Stack spacing={2} mt={2}>
                    <Grid2 container rowSpacing={2} columnSpacing={4}>
                        <PurchaseMessage course={course} />

                        <Grid2 xs={12} sm={12} md={6} lg={6} xl={4}>
                            <Stack spacing={2}>
                                {course.description.split('\n\n').map((p, i) => (
                                    <Typography key={i} mb={2}>
                                        {p}
                                    </Typography>
                                ))}

                                {course.whatsIncluded?.length && (
                                    <Stack>
                                        <Typography>What's Included:</Typography>
                                        <ul style={{ marginTop: 0 }}>
                                            {course.whatsIncluded.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))}
                                        </ul>
                                    </Stack>
                                )}
                            </Stack>
                        </Grid2>

                        <Grid2
                            xs={12}
                            sm={12}
                            md={6}
                            lg={4}
                            xl={3}
                            display='flex'
                            flexDirection='column'
                            alignItems='center'
                            justifyContent='center'
                        >
                            {(!isFreeTier || course.availableForFreeUsers) && (
                                <BuyButton
                                    id={course.stripeBuyButtonId}
                                    referenceId={user.username}
                                />
                            )}
                        </Grid2>
                    </Grid2>
                </Stack>
            </Stack>
        </Container>
    );
};

interface PurchaseMessageProps {
    course: Course;
}

const PurchaseMessage: React.FC<PurchaseMessageProps> = ({ course }) => {
    const isFreeTier = useFreeTier();

    let content = null;

    if (isFreeTier) {
        if (!course.availableForFreeUsers) {
            content = (
                <UpsellAlert>This course is only available to subscribers</UpsellAlert>
            );
        } else if (course.includedWithSubscription) {
            content = (
                <Alert
                    severity='info'
                    action={
                        <Button
                            color='inherit'
                            href='https://www.chessdojo.club/plans-pricing'
                            target='_blank'
                            rel='noopener'
                            size='small'
                        >
                            View Prices
                        </Button>
                    }
                >
                    You can unlock this and other courses by subscribing to the Training
                    Program
                </Alert>
            );
        }
    } else {
        content = (
            <Alert severity='info'>
                This course is sold separately from the Training Plan. Unlock it by
                purchasing it below.
            </Alert>
        );
    }

    if (!content) {
        return null;
    }

    return (
        <>
            <Grid2 xs={12} sm={12} md={12} lg={10} xl={7} mb={2}>
                {content}
            </Grid2>
            <Grid2 xs={0} lg={2} xl={5}></Grid2>
        </>
    );
};

export default PurchaseCoursePage;
