import { useState, useMemo } from 'react';
import { Stack, TextField, MenuItem } from '@mui/material';

import { compareCohorts, dojoCohorts, User } from '../../database/user';
import { useRequirements } from '../../api/cache/requirements';
import { getCurrentScore, Requirement } from '../../database/requirement';
import PieChart, { PieChartData } from './PieChart';
import { CategoryColors } from './activity';

function getScoreChartData(
    requirements: Requirement[],
    user: User,
    cohort: string
): PieChartData[] {
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

function getTimeChartData(
    requirements: Requirement[],
    user: User,
    cohort: string
): PieChartData[] {
    const requirementMap =
        requirements.reduce((map, r) => {
            map[r.id] = r;
            return map;
        }, {} as Record<string, Requirement>) ?? {};

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

function getTimeChartTooltip(entry: PieChartData) {
    const hours = Math.floor(entry.value / 60);
    const minutes = entry.value % 60;
    return `${entry.name} - ${hours}h ${minutes}m`;
}

interface ActivityPieChartProps {
    user: User;
}

const ActivityPieChart: React.FC<ActivityPieChartProps> = ({ user }) => {
    const [cohort, setCohort] = useState(user.dojoCohort);
    const { requirements } = useRequirements(cohort, false);

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
        return getScoreChartData(requirements, user, cohort);
    }, [requirements, user, cohort]);

    const cohortScore = useMemo(() => {
        let score = 0;
        for (const requirement of requirements) {
            score += getCurrentScore(cohort, requirement, user.progress[requirement.id]);
        }
        return Math.round(score * 100) / 100;
    }, [requirements, user, cohort]);

    const timeChartData = useMemo(() => {
        return getTimeChartData(requirements, user, cohort);
    }, [requirements, user, cohort]);

    const onChangeCohort = (cohort: string) => {
        setCohort(cohort);
    };

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

            <PieChart
                id='score-chart'
                title='Score Breakdown'
                subtitle={`Total Cohort Score: ${cohortScore}`}
                data={scoreChartData}
                getTooltip={(entry) => `${entry.name} - ${entry.value}`}
            />

            <PieChart
                id='time-chart'
                title='Time Breakdown'
                data={timeChartData}
                getTooltip={getTimeChartTooltip}
            />
        </Stack>
    );
};

export default ActivityPieChart;
