import { Course } from '@/database/course';
import { useRouter } from '@/hooks/useRouter';
import UpsellAlert from '@/upsell/UpsellAlert';
import { Alert, Button, Container, Divider, Grid, Stack, Typography } from '@mui/material';
import PurchaseOption from './PurchaseOption';

interface PurchaseCoursePageProps {
    course?: Course;
    preview?: boolean;
    isFreeTier: boolean;
}

const PurchaseCoursePage: React.FC<PurchaseCoursePageProps> = ({ course, preview, isFreeTier }) => {
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
                    <Grid container rowSpacing={2} columnSpacing={4} alignItems='center'>
                        <PurchaseMessage course={course} isFreeTier={isFreeTier} />

                        <Grid
                            size={{
                                xs: 12,
                                sm: 12,
                                md: 6,
                                lg: 6,
                                xl: 4,
                            }}
                        >
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
                        </Grid>

                        {(!isFreeTier || course.availableForFreeUsers) &&
                            course.purchaseOptions?.map((option) => (
                                <Grid
                                    key={option.name}
                                    size={{
                                        xs: 12,
                                        md: 6,
                                        lg: 4,
                                        xl: 3,
                                    }}
                                >
                                    <PurchaseOption
                                        course={course}
                                        purchaseOption={option}
                                        preview={preview}
                                    />
                                </Grid>
                            ))}
                    </Grid>
                </Stack>
            </Stack>
        </Container>
    );
};

interface PurchaseMessageProps {
    course: Course;
    isFreeTier: boolean;
}

const PurchaseMessage: React.FC<PurchaseMessageProps> = ({ course, isFreeTier }) => {
    const router = useRouter();

    const onViewPrices = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const currentPage = encodeURIComponent(window.location.href);
        router.push(`/prices?redirect=${currentPage}`);
    };

    let content = null;
    if (isFreeTier) {
        if (!course.availableForFreeUsers) {
            content = <UpsellAlert>This course is only available to subscribers</UpsellAlert>;
        } else if (course.includedWithSubscription) {
            content = (
                <Alert
                    severity='info'
                    action={
                        <Button color='inherit' href='/prices' size='small' onClick={onViewPrices}>
                            View Prices
                        </Button>
                    }
                >
                    You can also unlock this and all other opening courses by subscribing to the
                    Training Program
                </Alert>
            );
        }
    } else {
        content = (
            <Alert severity='info'>
                This course is sold separately from the Training Plan. Unlock it by purchasing it
                below.
            </Alert>
        );
    }

    if (!content) {
        return null;
    }

    return (
        <>
            <Grid
                mb={2}
                size={{
                    xs: 12,
                    sm: 12,
                    md: 12,
                    lg: 10,
                    xl: 7,
                }}
            >
                {content}
            </Grid>
            <Grid
                size={{
                    xs: 0,
                    lg: 2,
                    xl: 5,
                }}
            ></Grid>
        </>
    );
};

export default PurchaseCoursePage;
