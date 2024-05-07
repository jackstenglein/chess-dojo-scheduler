import { CardContent, Stack, Typography } from '@mui/material';
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
import { useEffect, useMemo, useRef, useState } from 'react';
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
    const ref = useRef<HTMLDivElement>(null);
    const [legendMargin, setLegendMargin] = useState(100);

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
                data: Array.from(Array(totalScore + 2)).map((_, i) =>
                    regression.predict(i),
                ),
                color: isLight ? '#000' : '#fff',
            },
        ] as LineSeriesType[];
    }, [exam, totalScore]);

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        const observer = new ResizeObserver(() => {
            const newLegendMargin = getLegendMargin(
                series.length,
                ref.current?.getBoundingClientRect().width || 0,
            );
            setLegendMargin(newLegendMargin);
        });
        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [ref, series, setLegendMargin]);

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

    let userCount = series.reduce((sum, s) => sum + s.data.length, 0);
    if (cohorts[0] === ALL_COHORTS || cohorts.includes(user.dojoCohort)) {
        userCount += 1;
    }

    const avgScore =
        series.reduce((sum, s) => sum + s.data.reduce((ds, d) => ds + d.x, 0), 0) /
        userCount;

    return (
        <CardContent sx={{ height: 1 }}>
            <Stack ref={ref} height={1}>
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

                <Stack direction='row' spacing={2} justifyContent='center' mt={1} mb={1}>
                    <Typography variant='body2'>
                        <Typography
                            variant='body2'
                            component='span'
                            color='text.secondary'
                        >
                            Users:
                        </Typography>{' '}
                        {userCount}
                    </Typography>
                    <Typography variant='body2'>
                        <Typography
                            variant='body2'
                            component='span'
                            color='text.secondary'
                        >
                            Avg Score:
                        </Typography>{' '}
                        {Math.round(10 * avgScore) / 10}
                    </Typography>
                </Stack>

                <ResponsiveChartContainer
                    disableAxisListener
                    xAxis={[
                        {
                            label: 'Score',
                            data: Array.from(Array(totalScore + 2)).map((_, i) => i),
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
                    series={[...series, ...lineSeries, ...yourScoreSeries]}
                    margin={{ left: 60, right: 8, top: legendMargin }}
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
                                padding: 0,
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

const legendPadding = 11.5;
const cohortLegendWidth = 60;
const legendLineHeight = 14;
const yourScoreWidth = 90;
const bestFitWidth = 62;

function getLegendMargin(numCohorts: number, parentWidth: number): number {
    if (parentWidth <= 0) {
        return 100;
    }

    const cohortsPerLine = Math.floor(parentWidth / cohortLegendWidth);
    const numCohortLines = Math.ceil(numCohorts / cohortsPerLine);

    const leftoverWidth =
        parentWidth -
        yourScoreWidth -
        bestFitWidth -
        cohortLegendWidth * (numCohorts - cohortsPerLine * (numCohortLines - 1));
    const numLines = leftoverWidth < 0 ? numCohortLines + 1 : numCohortLines;

    console.log('Num lines: ', numLines);

    return 2 * legendPadding + numLines * legendLineHeight + 9 * (numLines - 1);
}
