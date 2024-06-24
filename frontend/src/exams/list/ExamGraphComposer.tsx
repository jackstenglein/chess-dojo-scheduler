import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React, { useState } from 'react';
import { useRequirements } from '../../api/cache/requirements';
import { toDojoDateString } from '../../calendar/displayDate';
import { ExamType } from '../../database/exam';
import { ALL_COHORTS, User } from '../../database/user';
import { calculateTacticsRating } from '../../exams/view/exam';
import { TacticsRatingComponent } from '../view/exam';
import ExamGraph from './ExamGraph';

/**
 * Gets the list of user's exam ratings filtered by exam type.
 * @param user - The user object containing exam summaries.
 * @param examType - The type of exam to filter by.
 * @returns A list of exam ratings for the specified exam type.
 */
function getUserExamRatingsByType(user: User, examType: ExamType): number[] {
    let getFinal: number[] = [];

    Object.values(user.exams)
        .filter((examSummary) => examSummary.examType === examType)
        .map((examSummary) => getFinal.push(examSummary.rating));

    return getFinal;
}

/**
 * Gets the list of user's exam creation times from the exams field.
 * @param user - The user object containing exam summaries.
 * @returns A list of exam creation times.
 */
function getUserExamCreationTimes(user: User, examType: ExamType): string[] {
    return Object.values(user.exams)
        .filter((examSummary) => examSummary.examType === examType)
        .map((examSummary) =>
            toDojoDateString(new Date(examSummary.createdAt), user.timezoneOverride),
        )
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

/**
 * Gets the the color for the exam component
 * @param t TacticsRatingCompontent
 * @returns hexcode color
 */

export function getExamColour(t: TacticsRatingComponent): string {
    if (t.name.includes('Checkmate Tests')) {
        return '#8c03fc';
    } else if (t.name.includes('Tactics Tests')) {
        return '#55d444';
    } else if (t.name.includes('Endgame Tests')) {
        return '#186aed';
    } else if (t.name.includes('PR 5 Min')) {
        return '#c9f03c';
    } else if (t.name.includes('PR Survival')) {
        return '#ab3cf0';
    } else if (t.name.includes('Positional Tests')) {
        return '#d61313';
    }

    return '#4b4d49';
}

/**
 * Exam Composer interface for ExamGraphComposer component props
 */

interface ExamComposer {
    user: User; // Dojo user
    width: number; // width of the Card
    height: number; // height of the Card
}

/**
 * function to render the card containting the graph of a user's tactical ratings
 * @param ExamComposer interface
 * @returns users' tactics rating card
 */

const ExamGraphComposer: React.FC<ExamComposer> = ({ user, width, height }) => {
    const { requirements } = useRequirements(ALL_COHORTS, true);
    const tacticsRating = calculateTacticsRating(user, requirements);
    const isProvisional = tacticsRating.components.some((c) => c.rating < 0);
    const realRating = Math.round(tacticsRating.overall);
    const [showTacticsGraph, setTacticsGraph] = useState(true);
    let checkProvLine: number[];
    if (isProvisional) {
        checkProvLine = [];
    } else {
        checkProvLine = [realRating];
    }

    const handleTacGraphClick = () => {
        setTacticsGraph(!showTacticsGraph);
    };

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack
                    direction='column'
                    mb={2}
                    spacing={2}
                    justifyContent='center'
                    alignItems='center'
                >
                    <Typography
                        variant='h6'
                        sx={{
                            fontWeight: 'bold',
                        }}
                        align='center'
                    >
                        Tactics History{' '}
                    </Typography>
                    {showTacticsGraph ? (
                        <ExamGraph
                            data={getUserExamRatingsByType(user, ExamType.Tactics)}
                            label='Tactics Test'
                            color='#55d444'
                            xLabels={getUserExamCreationTimes(user, ExamType.Tactics)}
                            width={width}
                            isUserProv={isProvisional}
                            checkProvLine={checkProvLine}
                            realRating={realRating}
                            height={height}
                        />
                    ) : (
                        <ExamGraph
                            data={getUserExamRatingsByType(user, ExamType.Polgar)}
                            label='Checkmate Test'
                            color='#5905a3'
                            xLabels={getUserExamCreationTimes(user, ExamType.Polgar)}
                            isUserProv={isProvisional}
                            checkProvLine={checkProvLine}
                            realRating={realRating}
                            width={width}
                            height={height}
                        />
                    )}
                </Stack>
                <Grid2 container rowGap={4} columnSpacing={2} justifyContent='end'>
                    <Button variant='text' onClick={handleTacGraphClick} color='info'>
                        {showTacticsGraph ? 'Checkmate' : 'Tactics'}
                    </Button>
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default ExamGraphComposer;
