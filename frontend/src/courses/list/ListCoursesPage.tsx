import { Container, Grid2 } from '@mui/material';
import { useEffect } from 'react';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import { Course } from '../../database/course';
import { SubscriptionStatus } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import { getCheckoutSessionId } from '../localStorage';
import { CourseFilterEditor, useCourseFilters } from './CourseFilters';
import CourseListItem from './CourseListItem';

const ListCoursesPage = () => {
    const courseFilters = useCourseFilters();
    const request = useRequest<Course[]>();
    const api = useApi();
    const user = useAuth().user;

    useEffect(() => {
        if (!request.isSent()) {
            api.listAllCourses()
                .then((courses) => {
                    request.onSuccess(courses);
                    console.log('listCourses: ', courses);
                })
                .catch((err) => {
                    console.error('listCourses: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    const noItems = !request.data?.length;

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />
            <Grid2 container spacing={3}>
                <Grid2
                    size={{
                        xs: 12,
                        md: 2,
                    }}
                >
                    <CourseFilterEditor filters={courseFilters} />
                </Grid2>

                <Grid2
                    container
                    spacing={2}
                    size={{
                        xs: 12,
                        md: 10,
                    }}
                >
                    {request.data?.map((course) => (
                        <Grid2
                            key={course.id}
                            size={{
                                xs: 12,
                                md: 6,
                                lg: 4,
                            }}
                        >
                            <CourseListItem
                                key={course.id}
                                course={course}
                                isFreeTier={
                                    user?.subscriptionStatus !==
                                    SubscriptionStatus.Subscribed
                                }
                                isPurchased={
                                    user?.purchasedCourses
                                        ? user.purchasedCourses[course.id]
                                        : getCheckoutSessionId(course.id) !== ''
                                }
                                filters={courseFilters}
                            />
                        </Grid2>
                    ))}

                    {noItems && request.isLoading() && <LoadingPage />}
                </Grid2>
            </Grid2>
        </Container>
    );
};

export default ListCoursesPage;
