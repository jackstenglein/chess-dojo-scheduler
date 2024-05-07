import { CardContent, Stack } from '@mui/material';
import {
    ChartsClipPath,
    ChartsGrid,
    ChartsLegend,
    ChartsTooltip,
    ChartsVoronoiHandler,
    ChartsXAxis,
    ChartsYAxis,
    LinePlot,
    LineSeriesType,
    ResponsiveChartContainer,
    ScatterPlot,
    ScatterSeriesType,
    axisClasses,
    cheerfulFiestaPalette,
    lineElementClasses,
} from '@mui/x-charts';
import { useMemo, useState } from 'react';
import { useLightMode } from '../ThemeProvider';
import { useAuth } from '../auth/Auth';
import { Exam } from '../database/exam';
import { ALL_COHORTS, cohortColors, compareCohorts } from '../database/user';
import MultipleSelectChip from '../newsfeed/list/MultipleSelectChip';
import { getRegression } from './list/ExamsTable';
import { getTotalScore } from './tactics';

interface ExamStatisticsProps {
    /** The exam to display statistics for. */
    exam: Exam;
}

/**
 * Renders a scatter plot of the scores on the exam, along with the linear regression for the exam.
 * @param param0 The exam to display statistics for.
 */
const ExamStatistics: React.FC<ExamStatisticsProps> = ({ exam }) => {
    const [cohorts, setCohorts] = useState([ALL_COHORTS]);
    const user = useAuth().user!;
    const isLight = useLightMode();

    const cohortToSeries = useMemo(() => {
        const cohortToSeries: Record<string, ScatterSeriesType> = {};

        Object.entries(exam.answers).forEach(([username, answer]) => {
            if (answer.rating <= 0 || username === user.username) {
                return;
            }

            const series = cohortToSeries[answer.cohort] || {
                type: 'scatter',
                label: answer.cohort.replaceAll('00', ''),
                data: [],
                highlightScope: {
                    highlighted: 'item',
                    faded: 'global',
                },
                valueFormatter: (value) => `Score: ${value.x}, Rating: ${value.y}`,
                color: cohortColors[answer.cohort],
            };
            series.data?.push({ x: answer.score, y: answer.rating, id: username });
            cohortToSeries[answer.cohort] = series;
        });

        return cohortToSeries;
    }, [exam, user]);

    const series = useMemo(() => {
        if (cohorts[0] === ALL_COHORTS) {
            return Object.entries(cohortToSeries)
                .sort((lhs, rhs) => compareCohorts(lhs[0], rhs[0]))
                .map((v) => v[1]);
        }

        return Object.entries(cohortToSeries)
            .filter(([cohort]) => cohorts.includes(cohort))
            .sort((lhs, rhs) => compareCohorts(lhs[0], rhs[0]))
            .map((v) => v[1]);
    }, [cohortToSeries, cohorts]);

    const totalScore = useMemo(
        () => exam.pgns.reduce((sum, pgn) => sum + getTotalScore(pgn), 0),
        [exam],
    );

    const lineSeries = useMemo(() => {
        const regression = getRegression(exam);
        if (!regression) {
            return [];
        }

        return [
            {
                id: 'best-fit',
                type: 'line',
                label: 'Best Fit',
                data: Array.from(Array(totalScore + 1)).map((_, i) =>
                    regression.predict(i),
                ),
                color: isLight ? '#000' : '#fff',
            },
        ] as LineSeriesType[];
    }, [exam, totalScore]);

    const onChangeCohort = (newCohorts: string[]) => {
        const addedCohorts = newCohorts.filter((c) => !cohorts.includes(c));
        let finalCohorts = [];
        if (addedCohorts.includes(ALL_COHORTS)) {
            finalCohorts = [ALL_COHORTS];
        } else {
            finalCohorts = newCohorts.filter((c) => c !== ALL_COHORTS);
        }

        setCohorts(finalCohorts);
    };

    const yourScoreSeries: ScatterSeriesType[] = exam.answers[user.username]
        ? [
              {
                  type: 'scatter',
                  label: 'Your Score',
                  data: [
                      {
                          x: exam.answers[user.username].score,
                          y: exam.answers[user.username].rating,
                          id: user.username,
                      },
                  ],
                  highlightScope: {
                      highlighted: 'item',
                      faded: 'global',
                  },
                  valueFormatter: (value) => `Score: ${value.x},\nRating: ${value.y}`,
                  color: isLight ? '#000' : '#fff',
              },
          ]
        : [];

    return (
        <CardContent sx={{ height: 1 }}>
            <Stack height={1}>
                <MultipleSelectChip
                    label='Cohorts'
                    selected={cohorts}
                    setSelected={onChangeCohort}
                    options={{
                        [ALL_COHORTS]: 'All Cohorts',
                        ...Object.keys(cohortToSeries)
                            .sort(compareCohorts)
                            .reduce(
                                (acc, cohort) => {
                                    acc[cohort] = cohort;
                                    return acc;
                                },
                                {} as Record<string, string>,
                            ),
                    }}
                    error={cohorts.length === 0}
                />

                <ResponsiveChartContainer
                    disableAxisListener
                    xAxis={[
                        {
                            label: 'Score',
                            data: Array.from(Array(totalScore + 1)).map((_, i) => i),
                            min: 0,
                        },
                    ]}
                    yAxis={[
                        {
                            label: 'Normalized Rating',
                            valueFormatter: (value) => `${value}`,
                            min: 0,
                        },
                    ]}
                    series={[...yourScoreSeries, ...series, ...lineSeries]}
                    margin={{ left: 60, right: 8, top: 100 }}
                    sx={{
                        [`& .${axisClasses.left} .${axisClasses.label}`]: {
                            transform: 'translateX(-20px)',
                        },
                        [`.${lineElementClasses.root}`]: {
                            strokeWidth: 1,
                        },
                        '.MuiLineElement-series-best-fit': {
                            strokeDasharray: '5 5',
                        },
                    }}
                    colors={cheerfulFiestaPalette}
                >
                    <ChartsLegend
                        slotProps={{
                            legend: {
                                itemMarkWidth: 10,
                                itemMarkHeight: 10,
                                labelStyle: { fontSize: 13 },
                            },
                        }}
                    />
                    <ChartsGrid vertical horizontal />

                    <ChartsYAxis />
                    <ChartsXAxis />

                    <g clipPath='url(#clip-path)'>
                        <LinePlot />
                    </g>
                    <ScatterPlot />
                    <ChartsVoronoiHandler />
                    <ChartsTooltip trigger='item' />
                    <ChartsClipPath id='clip-path' />
                </ResponsiveChartContainer>
            </Stack>
        </CardContent>
    );
};

export default ExamStatistics;
