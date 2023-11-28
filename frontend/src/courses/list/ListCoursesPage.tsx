import { Container } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { useEffect } from 'react';

import { CourseFilterEditor, useCourseFilters } from './CourseFilters';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { Course } from '../../database/course';
import { useApi } from '../../api/Api';
import CourseListItem from './CourseListItem';

const ListCoursesPage = () => {
    const courseFilters = useCourseFilters();
    const request = useRequest<Course[]>();
    const api = useApi();

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
    });

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Grid2 container spacing={3}>
                <Grid2 xs={12} md={2}>
                    <CourseFilterEditor filters={courseFilters} />
                </Grid2>

                <Grid2 container xs={12} md={10} spacing={2}>
                    {request.data?.map((course) => (
                        <CourseListItem
                            key={course.id}
                            course={course}
                            filters={courseFilters}
                        />
                    ))}
                </Grid2>
            </Grid2>
        </Container>
    );
};

export default ListCoursesPage;
