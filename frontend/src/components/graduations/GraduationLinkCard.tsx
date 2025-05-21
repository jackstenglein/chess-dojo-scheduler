'use client';

import { toDojoDateString, toDojoTimeString } from '@/components/calendar/displayDate';
import { Graduation } from '@/database/graduation';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import Link from 'next/link';

interface GraduationLinkCardProps {
    graduation: Graduation;
    to: string;
}

export const GraduationLinkCard = ({ graduation, to }: GraduationLinkCardProps) => {
    const { newCohort, displayName, createdAt: graduatedAt } = graduation;

    const dateStr = toDojoDateString(new Date(graduatedAt), undefined);
    const timeStr = toDojoTimeString(new Date(graduatedAt), undefined, undefined);

    return (
        <Grid
            size={{
                xs: 12,
                sm: 6,
            }}
        >
            <Card sx={{ height: 1 }}>
                <CardActionArea component={Link} sx={{ height: 1 }} href={to}>
                    <CardContent>
                        <Stack
                            height={1}
                            justifyContent='center'
                            alignItems='center'
                            textAlign='center'
                            spacing={2}
                        >
                            <CohortIcon cohort={newCohort} size={100} color='primary' />
                            <Typography variant='h5'>{displayName}</Typography>
                            <Typography variant='subtitle1' color='text.secondary' lineHeight='1.3'>
                                <div>Graduated to {newCohort}</div>
                                <div>
                                    {dateStr} • {timeStr}
                                </div>
                            </Typography>
                        </Stack>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
};
