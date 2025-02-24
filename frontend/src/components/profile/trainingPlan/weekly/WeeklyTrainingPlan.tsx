import { RequestSnackbar } from '@/api/Request';
import { User } from '@/database/user';
import {
    ExpandLess,
    ExpandMore,
    KeyboardDoubleArrowDown,
    KeyboardDoubleArrowUp,
} from '@mui/icons-material';
import { Button, Stack } from '@mui/material';
import { TimeframeTrainingPlanSection } from '../daily/TimeframeTrainingPlanSection';
import { useExpanded } from '../useExpanded';
import { useWeeklyTrainingPlan } from '../useTrainingPlan';
import { DAY_NAMES } from '../workGoal';

export function WeeklyTrainingPlan({ user }: { user: User }) {
    const { expanded, toggleExpand, onExpandAll, onCollapseAll } = useExpanded({
        total: true,
        '0': false,
        '1': false,
        '2': false,
        '3': false,
        '4': false,
        '5': false,
        '6': false,
    });

    const {
        request,
        pinnedTasks,
        togglePin,
        isCurrentUser,
        suggestionsByDay,
        weekSuggestions,
        startDate,
        endDate,
    } = useWeeklyTrainingPlan(user);

    console.log('Week Start: ', startDate);
    console.log('Week End: ', endDate);

    return (
        <>
            <RequestSnackbar request={request} />

            <Stack
                direction='row'
                spacing={1}
                justifyContent='end'
                width={1}
                mt={2}
                mb={expanded.total ? -2 : 0}
            >
                <Button onClick={onExpandAll} startIcon={<KeyboardDoubleArrowDown />}>
                    Expand All
                </Button>
                <Button onClick={onCollapseAll} startIcon={<KeyboardDoubleArrowUp />}>
                    Collapse All
                </Button>
            </Stack>

            <TimeframeTrainingPlanSection
                startDate={startDate}
                endDate={endDate}
                title='This Week'
                icon={
                    expanded.total ? (
                        <ExpandLess
                            sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                        />
                    ) : (
                        <ExpandMore
                            sx={{ marginRight: '0.6rem', verticalAlign: 'middle' }}
                        />
                    )
                }
                user={user}
                isCurrentUser={isCurrentUser}
                tasks={weekSuggestions}
                pinnedTasks={pinnedTasks}
                togglePin={togglePin}
                expanded={expanded.total}
                toggleExpanded={() => toggleExpand('total')}
            />

            {new Array(7).fill(0).map((_, idx) => {
                const dayIdx = (user.weekStart + idx) % 7;
                const suggestedTasks = suggestionsByDay[dayIdx];
                if (!suggestedTasks || suggestedTasks.length === 0) {
                    return null;
                }

                const dayStart = getDayOfWeekAfterDate(new Date(startDate), dayIdx);
                const start = new Date(dayStart);
                const end = new Date(dayStart);
                end.setDate(end.getDate() + 1);
                const dayEnd = end.toISOString();

                return (
                    <TimeframeTrainingPlanSection
                        key={dayIdx}
                        startDate={dayStart}
                        endDate={dayEnd}
                        title={`${DAY_NAMES[dayIdx]} ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                        icon={
                            expanded[`${dayIdx}`] ? (
                                <ExpandLess
                                    sx={{
                                        marginRight: '0.6rem',
                                        verticalAlign: 'middle',
                                    }}
                                />
                            ) : (
                                <ExpandMore
                                    sx={{
                                        marginRight: '0.6rem',
                                        verticalAlign: 'middle',
                                    }}
                                />
                            )
                        }
                        user={user}
                        isCurrentUser={isCurrentUser}
                        tasks={suggestedTasks}
                        pinnedTasks={pinnedTasks}
                        togglePin={togglePin}
                        expanded={expanded[`${dayIdx}`]}
                        toggleExpanded={() => toggleExpand(`${dayIdx}`)}
                    />
                );
            })}
        </>
    );
}

function getDayOfWeekAfterDate(reference: Date, day: number): string {
    reference.setHours(0, 0, 0, 0);
    if (reference.getDay() < day) {
        reference.setDate(reference.getDate() + day - reference.getDay());
    } else if (reference.getDay() > day) {
        reference.setDate(reference.getDate() + 7 - reference.getDay() + day);
    }
    return reference.toISOString();
}
