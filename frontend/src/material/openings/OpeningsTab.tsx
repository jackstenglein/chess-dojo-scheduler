import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { Course } from '../../database/opening';
import LoadingPage from '../../loading/LoadingPage';

interface OpeningTabLevel {
    name: string;
    colors: OpeningTabColor[];
}

interface OpeningTabColor {
    name: string;
    courses: {
        id: string;
        name: string;
    }[];
}

const OpeningsTab = () => {
    const request = useRequest<Course[]>();
    const api = useApi();

    useEffect(() => {
        if (!request.isSent()) {
            api.listCourses()
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

    const levels = useMemo(() => {
        const levels: OpeningTabLevel[] = [];
        if (request.data) {
            for (const course of request.data) {
                let level: OpeningTabLevel | undefined = levels.find(
                    (l1) => l1.name === course.cohortRange
                );

                if (level === undefined) {
                    level = { name: course.cohortRange, colors: [] };
                    levels.push(level);
                }

                let color = level.colors.find((c) => c.name === course.color);
                if (color === undefined) {
                    color = { name: course.color, courses: [] };
                    level.colors.push(color);
                }
                color.courses.push({ id: course.id, name: course.name });
            }
        }
        return levels;
    }, [request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    console.log('levels: ', levels);

    return (
        <Stack spacing={4}>
            <RequestSnackbar request={request} />

            {levels.length > 0 &&
                levels.map((level) => (
                    <Stack key={level.name} spacing={0.5}>
                        <Typography variant='h5'>{level.name}</Typography>

                        <Stack spacing={1} pl={3}>
                            {level.colors.map((color) => (
                                <Stack key={color.name} spacing={0.5}>
                                    <Typography variant='h6' color='text.secondary'>
                                        {color.name}
                                    </Typography>

                                    <Stack spacing={1} pl={3}>
                                        {color.courses.map((course) => (
                                            <Link
                                                key={course.id}
                                                to={`/openings/${course.id}/0`}
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <Stack
                                                    direction='row'
                                                    alignItems='center'
                                                    spacing={2}
                                                >
                                                    <Typography
                                                        variant='h6'
                                                        color='text.secondary'
                                                        sx={{ textDecoration: 'none' }}
                                                    >
                                                        {course.name}
                                                    </Typography>
                                                    <Typography
                                                        color='text.secondary'
                                                        pt='3px'
                                                    >
                                                        <ArrowForwardIosIcon />
                                                    </Typography>
                                                </Stack>
                                            </Link>
                                        ))}
                                    </Stack>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                ))}

            {(request.data === undefined || levels.length === 0) && (
                <Typography>No openings found</Typography>
            )}
        </Stack>
    );
};

export default OpeningsTab;
