import { useState, useMemo } from 'react';
import { Stack, TextField, MenuItem, Typography, Button } from '@mui/material';

import { compareCohorts, User } from '../../database/user';
import { useRequirements } from '../../api/cache/requirements';
import {
    CustomTask,
    getCurrentCount,
    getCurrentScore,
    Requirement,
} from '../../database/requirement';
import PieChart, { PieChartData } from './PieChart';
import { CategoryColors, RequirementColors } from './activity';

const numberedReqRegex = / #\d+$/;

function getScoreChartData(
    requirements: Requirement[],
    user: User,
    cohort: string,
    category: string
): PieChartData[] {
    if (category) {
        return getCategoryScoreChartData(requirements, user, cohort, category);
    }

    const data: Record<string, PieChartData> = {};

    for (const requirement of requirements) {
        const category = requirement.category;
        const score = getCurrentScore(cohort, requirement, user.progress[requirement.id]);

        if (data[category]) {
            data[category].value += score;
        } else if (score > 0) {
            data[category] = {
                name: category,
                value: score,
                color: CategoryColors[category],
            };
        }
    }

    return Object.values(data);
}

function getCategoryScoreChartData(
    requirements: Requirement[],
    user: User,
    cohort: string,
    category: string
): PieChartData[] {
    const data: Record<string, PieChartData> = {};

    for (const requirement of requirements) {
        if (category !== requirement.category) {
            continue;
        }

        const score = getCurrentScore(cohort, requirement, user.progress[requirement.id]);
        if (score === 0) {
            continue;
        }
        const count = getCurrentCount(cohort, requirement, user.progress[requirement.id]);

        let name = requirement.name;
        const result = numberedReqRegex.exec(name);
        if (result) {
            name = name.substring(0, result.index);
        }

        if (data[name]) {
            data[name].value += score;
            data[name].count = (data[name].count || 0) + count;
        } else {
            data[name] = {
                name,
                value: score,
                color: RequirementColors[
                    Object.values(data).length % RequirementColors.length
                ],
                count,
            };
        }
    }

    return Object.values(data);
}

function getTimeChartData(
    requirements: Requirement[],
    user: User,
    cohort: string,
    category: string
): PieChartData[] {
    if (category) {
        return getCategoryTimeChartData(requirements, user, cohort, category);
    }

    const requirementMap =
        requirements.reduce((map, r) => {
            map[r.id] = r;
            return map;
        }, {} as Record<string, Requirement | CustomTask>) ?? {};

    user.customTasks?.forEach((t) => {
        requirementMap[t.id] = t;
    });

    const data: Record<string, PieChartData> = {};
    Object.values(user.progress).forEach((progress) => {
        if (!progress.minutesSpent || !progress.minutesSpent[cohort]) {
            return;
        }
        const requirement = requirementMap[progress.requirementId];
        if (!requirement) {
            return;
        }
        const categoryName = requirement.category;
        if (data[categoryName]) {
            data[categoryName].value += progress.minutesSpent[cohort];
        } else {
            data[categoryName] = {
                name: categoryName,
                value: progress.minutesSpent[cohort],
                color: CategoryColors[requirement.category],
            };
        }
    });

    return Object.values(data);
}

function getCategoryTimeChartData(
    requirements: Requirement[],
    user: User,
    cohort: string,
    category: string
): PieChartData[] {
    const data: Record<string, PieChartData> = {};

    for (const requirement of requirements) {
        if (category !== requirement.category) {
            continue;
        }
        const progress = user.progress[requirement.id];
        if (!progress || !progress.minutesSpent || !progress.minutesSpent[cohort]) {
            continue;
        }

        let name = requirement.name;
        const result = numberedReqRegex.exec(name);
        if (result) {
            name = name.substring(0, result.index);
        }

        if (data[name]) {
            data[name].value += progress.minutesSpent[cohort];
        } else {
            data[name] = {
                name,
                value: progress.minutesSpent[cohort],
                color: RequirementColors[
                    Object.values(data).length % RequirementColors.length
                ],
            };
        }
    }
    if (category === 'Non-Dojo') {
        for (const task of user.customTasks || []) {
            const progress = user.progress[task.id];
            if (!progress || !progress.minutesSpent || !progress.minutesSpent[cohort]) {
                continue;
            }

            let name = task.name;
            data[name] = {
                name,
                value: progress.minutesSpent[cohort],
                color: RequirementColors[
                    Object.values(data).length % RequirementColors.length
                ],
            };
        }
    }
    return Object.values(data);
}

function getScoreChartTooltip(entry?: PieChartData) {
    if (!entry) {
        return '';
    }
    const score = Math.round(entry.value * 100) / 100;
    if (entry.count) {
        return `${entry.name} - Count: ${entry.count}, Score: ${score}`;
    }
    return `${entry.name} - ${score}`;
}

function getTimeChartTooltip(entry?: PieChartData) {
    if (!entry) {
        return '';
    }
    return `${entry.name} - ${getTimeDisplay(entry.value)}`;
}

function getTimeDisplay(value: number) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${hours}h ${minutes}m`;
}

interface ActivityPieChartProps {
    user: User;
}

const ActivityPieChart: React.FC<ActivityPieChartProps> = ({ user }) => {
    const [cohort, setCohort] = useState(user.dojoCohort);
    const { requirements } = useRequirements(cohort, false);

    const [scoreChartCategory, setScoreChartCategory] = useState('');
    const [timeChartCategory, setTimeChartCategory] = useState('');

    const cohortOptions = useMemo(() => {
        if (!user.progress) {
            return [user.dojoCohort];
        }
        return Object.values(user.progress)
            .map((v) => Object.keys(v.minutesSpent ?? {}))
            .flat()
            .concat(user.dojoCohort)
            .sort(compareCohorts)
            .filter((item, pos, ary) => !pos || item !== ary[pos - 1]);
    }, [user.progress, user.dojoCohort]);

    const scoreChartData = useMemo(() => {
        return getScoreChartData(requirements, user, cohort, scoreChartCategory);
    }, [requirements, user, cohort, scoreChartCategory]);

    const timeChartData = useMemo(() => {
        return getTimeChartData(requirements, user, cohort, timeChartCategory);
    }, [requirements, user, cohort, timeChartCategory]);

    const onChangeCohort = (cohort: string) => {
        setScoreChartCategory('');
        setTimeChartCategory('');
        setCohort(cohort);
    };

    const onClickScoreChart = (_: any, segmentIndex: number) => {
        if (!scoreChartCategory) {
            setScoreChartCategory(scoreChartData[segmentIndex].name);
        }
    };

    const onClickTimeChart = (_: any, segmentIndex: number) => {
        if (!timeChartCategory) {
            setTimeChartCategory(timeChartData[segmentIndex].name);
        }
    };

    console.log('Time chart data: ', timeChartData);

    return (
        <Stack spacing={3} justifyContent='center' alignItems='center'>
            <TextField
                select
                label='Cohort'
                value={cohort}
                onChange={(event) => onChangeCohort(event.target.value)}
                sx={{ mb: 3 }}
                fullWidth
            >
                {cohortOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>

            <Typography variant='body2' color='text.secondary'>
                Click on a segment of the pie chart to see more details
            </Typography>

            <PieChart
                id='score-chart'
                title={`Score Breakdown${
                    scoreChartCategory && `: ${scoreChartCategory}`
                }`}
                data={scoreChartData}
                renderTotal={(score) => (
                    <Stack alignItems='center'>
                        <Typography variant='subtitle1'>
                            Total {scoreChartCategory ? 'Category' : 'Cohort'} Score:{' '}
                            {Math.round(score * 100) / 100}
                        </Typography>
                        {scoreChartCategory && (
                            <Button onClick={() => setScoreChartCategory('')}>
                                Back to Cohort
                            </Button>
                        )}
                    </Stack>
                )}
                getTooltip={getScoreChartTooltip}
                onClick={onClickScoreChart}
            />

            <PieChart
                id='time-chart'
                title={`Time Breakdown${timeChartCategory && `: ${timeChartCategory}`}`}
                data={timeChartData}
                renderTotal={(time) => (
                    <Stack alignItems='center'>
                        <Typography variant='subtitle1'>
                            Total {timeChartCategory ? 'Category' : 'Cohort'} Time:{' '}
                            {getTimeDisplay(time)}
                        </Typography>
                        {timeChartCategory && (
                            <Button onClick={() => setTimeChartCategory('')}>
                                Back to Cohort
                            </Button>
                        )}
                    </Stack>
                )}
                getTooltip={getTimeChartTooltip}
                onClick={onClickTimeChart}
            />
        </Stack>
    );
};

export default ActivityPieChart;
