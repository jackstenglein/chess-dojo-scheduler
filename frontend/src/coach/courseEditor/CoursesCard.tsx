import { useEffect } from 'react';
import { Card, CardContent, CardHeader, Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useApi } from '../../api/Api';
import { useRequest } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import { Course } from '../../database/course';
import LoadingPage from '../../loading/LoadingPage';

const CoursesCard = () => {
    const user = useAuth().user!;
    const request = useRequest<Course[]>();
    const api = useApi();

    useEffect(() => {
        if (user.coachInfo?.stripeId && !request.isSent()) {
            api.listAllCourses()
                .then((courses) => {
                    request.onSuccess(courses.filter((c) => c.owner === user.username));
                    console.log('listCourses: ', courses);
                })
                .catch((err) => {
                    console.error('listCourses: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api, user]);

    return (
        <Card variant='outlined'>
            <CardHeader
                title='Courses'
                // action={<Button variant='contained'>Create Course</Button>}
            />
            <CardContent>
                {(!request.isSent() || request.isLoading()) && <LoadingPage />}

                {!request.isLoading() && !request.data?.length && (
                    <Typography>You haven't created any courses yet.</Typography>
                )}

                <Stack spacing={0.5}>
                    {request.data?.map((course) => (
                        <Link
                            key={course.id}
                            component={RouterLink}
                            to={`courses/${course.type}/${course.id}`}
                        >
                            {course.name}
                        </Link>
                    ))}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default CoursesCard;
