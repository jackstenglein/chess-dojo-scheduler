import { Container, Stack, Typography, Divider, Link } from '@mui/material';

import { Course } from '../../database/course';
import { useAuth, useFreeTier } from '../../auth/Auth';
import BuyButton from './BuyButton';

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
                    <PurchaseMessage course={course} />

                    {(!isFreeTier || course.availableForFreeUsers) && (
                        <BuyButton
                            id={course.stripeBuyButtonId}
                            referenceId={user.username}
                        />
                    )}
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

    if (isFreeTier) {
        if (!course.availableForFreeUsers) {
            return (
                <Typography>
                    This course is only available to subscribers of the Training Program.{' '}
                    <Link
                        href='https://www.chessdojo.club/plans-pricing'
                        target='_blank'
                        rel='noopener'
                    >
                        Subscribe
                    </Link>{' '}
                    to access this course.
                </Typography>
            );
        }
        if (course.includedWithSubscription) {
            return (
                <Typography>
                    Unlock this course by{' '}
                    <Link
                        href='https://www.chessdojo.club/plans-pricing'
                        target='_blank'
                        rel='noopener'
                    >
                        subscribing
                    </Link>{' '}
                    to the Training Program or by purchasing it separately below.
                </Typography>
            );
        }
    }

    return (
        <Typography>
            This course is sold separately from the Training Plan. Unlock it by purchasing
            it below.
        </Typography>
    );
};

export default PurchaseCoursePage;
