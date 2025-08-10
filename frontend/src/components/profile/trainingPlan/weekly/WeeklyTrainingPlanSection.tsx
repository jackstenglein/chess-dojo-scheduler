import { useAuth } from '@/auth/Auth';
import { CategoryColors, themeRequirementCategory } from '@/style/ThemeProvider';
import { displayRequirementCategoryShort } from '@jackstenglein/chess-dojo-common/src/database/requirement';
import { alpha, Box, Card, Chip, Grid, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { SuggestedTask } from '../suggestedTasks';
import { useWeeklyTrainingPlan } from '../useTrainingPlan';

const days = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];

export function WeeklyTrainingPlanSection() {
    const { user } = useAuth();

    const { request, pinnedTasks, togglePin, isCurrentUser, suggestionsByDay, isLoading } =
        useWeeklyTrainingPlan(user!);

    const suggestedTasks = useMemo(() => suggestionsByDay[new Date().getDay()], [suggestionsByDay]);

    return (
        <Stack spacing={2} width={1}>
            <Typography variant='h5' fontWeight='bold'>
                This Week
            </Typography>

            <Grid container columns={7}>
                {days.map((d, i) => (
                    <Grid key={i} size={1}>
                        <WeeklyTrainingPlanDay dayIndex={i} suggestionsByDay={suggestionsByDay} />
                    </Grid>
                ))}
            </Grid>
        </Stack>
    );
}

function WeeklyTrainingPlanDay({
    suggestionsByDay,
    dayIndex,
}: {
    suggestionsByDay: SuggestedTask[][];
    dayIndex: number;
}) {
    const suggestedTasks = suggestionsByDay[dayIndex];

    return (
        <Stack height={1}>
            <Typography variant='subtitle1' fontWeight='bold' color='text.secondary'>
                {days[dayIndex]}
            </Typography>

            <Card
                sx={{
                    flexGrow: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: dayIndex === 0 ? undefined : 'none',
                }}
            >
                <Stack spacing={1} py={1} px={0.5}>
                    {suggestedTasks.map((t) => (
                        <WeeklyTrainingPlanItem key={t.task.id} suggestion={t} />

                        // <Fragment key={t.task.id}>
                        // <Card key={t.task.id} variant='outlined'>
                        //     <CardContent sx={{ flexGrow: 1 }}>
                        //         <Stack spacing={1}>
                        //             <Chip
                        //                 label={t.task.category}
                        //                 variant='outlined'
                        //                 sx={{
                        //                     color: CategoryColors[t.task.category],
                        //                     borderColor: CategoryColors[t.task.category],
                        //                     alignSelf: 'start',
                        //                 }}
                        //                 size='small'
                        //             />

                        //             <Typography variant='h6' fontWeight='bold'>
                        //                 {(t.task.dailyName || t.task.name).replaceAll(
                        //                     '{{time}}',
                        //                     formatTime(t.goalMinutes),
                        //                 )}
                        //             </Typography>
                        //         </Stack>

                        //         <Typography color='textSecondary' sx={{ mt: 1 }}>
                        //             {t.task.description.slice(0, 150)}...
                        //         </Typography>
                        //     </CardContent>
                        //     <CardActions disableSpacing>
                        //         <Tooltip title='View task details'>
                        //             <IconButton sx={{ color: 'text.secondary' }}>
                        //                 <Help />
                        //             </IconButton>
                        //         </Tooltip>

                        //         <Tooltip title='Skip task for now'>
                        //             <IconButton
                        //                 sx={{
                        //                     color: 'text.secondary',
                        //                     marginLeft: 'auto',
                        //                 }}
                        //             >
                        //                 <NotInterested />
                        //             </IconButton>
                        //         </Tooltip>

                        //         <Tooltip title={'Unpin from Daily Tasks'}>
                        //             <IconButton>
                        //                 <PushPin color='dojoOrange' />
                        //             </IconButton>
                        //         </Tooltip>

                        //         <Tooltip title='Update Progress'>
                        //             <span style={{ marginRight: '4px' }}>
                        //                 <CircularTimeProgress
                        //                     data-cy='update-task-button'
                        //                     value={0}
                        //                     max={t.goalMinutes}
                        //                     onClick={() => null}
                        //                 />
                        //             </span>
                        //         </Tooltip>
                        //     </CardActions>
                        // </Card>
                        // </Fragment>
                    ))}
                </Stack>
            </Card>
        </Stack>
    );
}

function WeeklyTrainingPlanItem({ suggestion }: { suggestion: SuggestedTask }) {
    const { task } = suggestion;

    return (
        <Box
            sx={{
                borderRadius: 1.5,
                position: 'relative',
                backgroundColor: alpha(CategoryColors[task.category], 0.2),
                overflow: 'hidden',
                py: 1,
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    width: '4px',
                    top: 0,
                    bottom: 0,
                    backgroundColor: CategoryColors[task.category],
                }}
            />
            <Stack sx={{ pl: '8px', pr: '4px' }} spacing={3}>
                <Typography variant='body2' fontWeight='bold'>
                    {task.name}
                </Typography>

                <Stack direction='row'>
                    <Chip
                        label={displayRequirementCategoryShort(task.category)}
                        color={themeRequirementCategory(task.category)}
                        size='small'
                        sx={{
                            fontSize: '0.75rem',
                            height: 'auto',
                            '& .MuiChip-label': {
                                px: 0.5,
                            },
                        }}
                    />
                </Stack>
            </Stack>
        </Box>
    );
}
