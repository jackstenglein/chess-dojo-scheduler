import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Stack, Typography, Link } from '@mui/material';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { Course, CourseType } from '../../database/course';
import LoadingPage from '../../loading/LoadingPage';
import { useFreeTier } from '../../auth/Auth';
import UpsellDialog, { RestrictedAction } from '../../upsell/UpsellDialog';

const LEVELS = ['Any Rating', 'Starter (1200-1800)', 'Expert (1800+)'];

interface CoursesTabColor {
    name: string;
    courses: Course[];
}

interface CoursesTabLevel {
    name: string;
    colors?: CoursesTabColor[];
    courses?: Course[];
}

interface CoursesTabProps {
    type: CourseType;
    groupByColor?: boolean;
}

const CoursesTab: React.FC<CoursesTabProps> = ({ type, groupByColor }) => {
    const request = useRequest<Course[]>();
    const api = useApi();
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);

    useEffect(() => {
        if (!request.isSent()) {
            api.listCourses(type)
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
        const levels: CoursesTabLevel[] = [];
        if (request.data) {
            for (const l of LEVELS) {
                const courses = request.data.filter((c) => c.cohortRange === l);
                const level = {
                    name: l,
                    colors: groupByColor
                        ? [
                              {
                                  name: 'White',
                                  courses: courses.filter((c) => c.color === 'White'),
                              },
                              {
                                  name: 'Black',
                                  courses: courses.filter((c) => c.color === 'Black'),
                              },
                          ]
                        : undefined,
                    courses: groupByColor ? undefined : courses,
                };

                levels.push(level);
            }
        }
        return levels;
    }, [request, groupByColor]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    const onClickLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (isFreeTier) {
            event.preventDefault();
            setUpsellDialogOpen(true);
        }
    };

    console.log('levels: ', levels);

    return (
        <Stack spacing={4}>
            <RequestSnackbar request={request} />

            {levels.length > 0 &&
                levels.map((level) => {
                    if (
                        groupByColor &&
                        level.colors?.every((c) => c.courses.length === 0)
                    ) {
                        return null;
                    }
                    if (!groupByColor && level.courses?.length === 0) {
                        return null;
                    }

                    return (
                        <Stack key={level.name} spacing={0.5} data-cy={level.name}>
                            <Typography variant='h5'>{level.name}</Typography>

                            <Stack spacing={1} pl={3}>
                                {groupByColor &&
                                    level.colors?.map((color) => {
                                        if (color.courses.length === 0) {
                                            return null;
                                        }

                                        return (
                                            <Stack key={color.name} spacing={0.5}>
                                                <Typography
                                                    variant='h6'
                                                    color='text.secondary'
                                                >
                                                    {color.name}
                                                </Typography>

                                                <ul>
                                                    {color.courses.map((course) => (
                                                        <Link
                                                            key={course.id}
                                                            component={RouterLink}
                                                            to={`/courses/${type}/${course.id}`}
                                                            style={{
                                                                textDecoration: 'none',
                                                            }}
                                                            onClick={onClickLink}
                                                        >
                                                            <li key={course.id}>
                                                                {course.name}
                                                            </li>
                                                        </Link>
                                                    ))}
                                                </ul>
                                            </Stack>
                                        );
                                    })}

                                {!groupByColor && (
                                    <ul>
                                        {level.courses?.map((course) => (
                                            <Link
                                                key={course.id}
                                                component={RouterLink}
                                                to={`/courses/${type}/${course.id}`}
                                                style={{
                                                    textDecoration: 'none',
                                                }}
                                                onClick={onClickLink}
                                            >
                                                <li key={course.id}>{course.name}</li>
                                            </Link>
                                        ))}
                                    </ul>
                                )}
                            </Stack>
                        </Stack>
                    );
                })}

            {(request.data === undefined || levels.length === 0) && (
                <Typography>No courses found</Typography>
            )}

            <UpsellDialog
                open={upsellDialogOpen}
                onClose={setUpsellDialogOpen}
                currentAction={RestrictedAction.AccessOpenings}
            />
        </Stack>
    );
};

export default CoursesTab;
