import {
    Card,
    CardActionArea,
    CardActions,
    CardContent,
    Chip,
    Stack,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import { LoadingButton } from '@mui/lab';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';
import React from 'react';

import { Course, CoursePurchaseOption } from '../../database/course';
import { useAuth } from '../../auth/Auth';
import { SubscriptionStatus, getCohortRange } from '../../database/user';
import { CourseFilters } from './CourseFilters';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { getCheckoutSessionId } from '../localStorage';

interface CourseListItemProps {
    course: Course;
    filters: CourseFilters;
}

const CourseListItem: React.FC<CourseListItemProps> = ({ course, filters }) => {
    const api = useApi();
    const request = useRequest();
    const navigate = useNavigate();
    const user = useAuth().user;
    const isFreeTier = user?.subscriptionStatus !== SubscriptionStatus.Subscribed;
    const isPurchased = user?.purchasedCourses
        ? user.purchasedCourses[course.id]
        : getCheckoutSessionId(course.id) !== '';

    if (!filters.categories[course.type]) {
        return null;
    }

    const isAccessible = isPurchased || (course.includedWithSubscription && !isFreeTier);
    if (filters.showAccessible && !isAccessible) {
        return null;
    }

    const cohortRange = getCohortRange(filters.minCohort, filters.maxCohort);
    if (cohortRange.every((c) => !course.cohorts.includes(c))) {
        return null;
    }

    const onClick = (event: React.MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        navigate(`/courses/${course.type}/${course.id}`);
    };

    let purchaseOption: CoursePurchaseOption | null = null;

    for (const option of course.purchaseOptions || []) {
        if (!purchaseOption || option.currentPrice < purchaseOption.currentPrice) {
            purchaseOption = option;
        }
    }

    let percentOff = 0;
    if (purchaseOption && purchaseOption.currentPrice > 0) {
        percentOff = Math.round(
            ((purchaseOption.fullPrice - purchaseOption.currentPrice) /
                purchaseOption.fullPrice) *
                100
        );
    }

    const category = course.type[0] + course.type.substring(1).toLowerCase();

    const onBuy = () => {
        request.onStart();
        api.purchaseCourse(
            course.type,
            course.id,
            purchaseOption?.name,
            window.location.href
        )
            .then((resp) => {
                console.log('purchaseCourse: ', resp);
                window.location.href = resp.data.url;
                request.onSuccess();
            })
            .catch((err) => {
                console.error('purchaseCourse: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Grid2 key={course.id} xs={12} md={6} lg={4}>
            <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
                <CardActionArea
                    sx={{ flexGrow: 1 }}
                    onClick={onClick}
                    href={`/courses/${course.type}/${course.id}`}
                >
                    <CardContent>
                        <Typography variant='h5'>{course.name}</Typography>

                        {isPurchased ? (
                            <Stack
                                direction='row'
                                alignItems='center'
                                mb={1}
                                spacing={0.5}
                            >
                                <CheckCircleOutlineIcon
                                    color='success'
                                    fontSize='small'
                                />
                                <Typography variant='subtitle1' color='text.secondary'>
                                    Purchased
                                </Typography>
                            </Stack>
                        ) : course.includedWithSubscription && !isFreeTier ? (
                            <Stack
                                direction='row'
                                alignItems='center'
                                mb={1}
                                spacing={0.5}
                            >
                                <CheckCircleOutlineIcon
                                    color='success'
                                    fontSize='small'
                                />
                                <Typography variant='subtitle1' color='text.secondary'>
                                    Included with subscription
                                </Typography>
                            </Stack>
                        ) : (
                            purchaseOption && (
                                <Stack
                                    direction='row'
                                    spacing={1}
                                    alignItems='baseline'
                                    mb={1}
                                >
                                    <Typography
                                        variant='h6'
                                        sx={{
                                            color:
                                                percentOff > 0 ? 'error.main' : undefined,
                                            textDecoration:
                                                percentOff > 0
                                                    ? 'line-through'
                                                    : undefined,
                                        }}
                                    >
                                        ${displayPrice(purchaseOption.fullPrice / 100)}
                                    </Typography>

                                    {percentOff > 0 && (
                                        <>
                                            <Typography variant='h6' color='success.main'>
                                                $
                                                {displayPrice(
                                                    purchaseOption.currentPrice / 100
                                                )}
                                            </Typography>

                                            <Typography color='text.secondary'>
                                                (-{percentOff}%)
                                            </Typography>
                                        </>
                                    )}
                                </Stack>
                            )
                        )}

                        <Stack direction='row' mb={2} spacing={1}>
                            <Chip
                                size='small'
                                label={category}
                                color={getCategoryColor(category)}
                            />

                            <Chip size='small' label={course.cohortRange} />

                            {course.color !== 'None' && (
                                <Chip size='small' label={course.color} />
                            )}
                        </Stack>

                        <Typography variant='body2'>{course.description}</Typography>
                    </CardContent>
                </CardActionArea>
                {!isAccessible && purchaseOption && (
                    <CardActions>
                        <LoadingButton
                            size='small'
                            loading={request.isLoading()}
                            onClick={onBuy}
                        >
                            Buy
                        </LoadingButton>
                        <RequestSnackbar request={request} />
                    </CardActions>
                )}
            </Card>
        </Grid2>
    );
};

function displayPrice(price: number): string {
    if (price % 1 === 0) {
        return `${price}`;
    }
    return price.toFixed(2);
}

export function getCategoryColor(category: string) {
    switch (category.toLowerCase()) {
        case 'opening':
            return 'opening';

        case 'endgame':
            return 'endgame';
    }

    return 'secondary';
}

export default CourseListItem;
