import { Card, CardContent, Stack, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React, { useState } from 'react';
import { useRequirements } from '../../api/cache/requirements';
import { toDojoDateString } from '../../calendar/displayDate';
import { ExamType } from '../../database/exam';
import { ALL_COHORTS, User } from '../../database/user';
import {
    PuzzleRush5MinReqId,
    PuzzleSurvivalReqId,
    calculateTacticsRating,
} from '../../exams/view/exam';
import { useTimeline } from '../../profile/activity/useTimeline';
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
    const [graphpicker, setGraphPicker] = React.useState<
        'tactics' | 'checkmate' | 'prfive' | 'prsuv'
    >('tactics');
    let puzzleRush5data: number[] = [];
    let puzzleSurvdata: number[] = [];
    let puzzleRush5Timeline: string[] = [];
    let puzzleSurTimeline: string[] = [];

    const timeline = useTimeline(user.username);

    Object.values(timeline.entries).map((his) => {
        if (his.requirementId === PuzzleRush5MinReqId) {
            puzzleRush5Timeline.push(
                toDojoDateString(new Date(his.createdAt), user.timezoneOverride),
            );
            puzzleRush5data.push(his.newCount);
        } else if (his.requirementId === PuzzleSurvivalReqId) {
            puzzleSurTimeline.push(
                toDojoDateString(new Date(his.createdAt), user.timezoneOverride),
            );
            puzzleSurvdata.push(his.newCount);
        }
    });

    puzzleRush5Timeline.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    puzzleSurTimeline.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let checkProvLine: number[];
    if (isProvisional) {
        checkProvLine = [];
    } else {
        checkProvLine = [realRating];
    }

    return (
        <Card variant='outlined'>
            <CardContent>
                <Grid2 container rowGap={4} columnSpacing={2} justifyContent='end'>
                    <TextField
                        select
                        sx={{ minWidth: 150 }}
                        label='Pick Rating Type'
                        value={graphpicker}
                        onChange={(event) =>
                            setGraphPicker(
                                event.target.value as
                                    | 'tactics'
                                    | 'checkmate'
                                    | 'prfive'
                                    | 'prsuv',
                            )
                        }
                    >
                        <MenuItem value='tactics'> Tactics</MenuItem>
                        <MenuItem value='checkmate'> Checkmate</MenuItem>
                        <MenuItem value='prfive'> PR 5 Min</MenuItem>
                        <MenuItem value='prsuv'> PR Survival</MenuItem>
                    </TextField>
                </Grid2>
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

                    {graphpicker === 'tactics' ? (
                        <ExamGraph
                            data={getUserExamRatingsByType(user, ExamType.Tactics)}
                            label='Tactics Test'
                            color='#55d444'
                            isPR={true}
                            xLabels={getUserExamCreationTimes(user, ExamType.Tactics)}
                            width={width}
                            isUserProv={isProvisional}
                            checkProvLine={checkProvLine}
                            realRating={realRating}
                            height={height}
                        />
                    ) : graphpicker === 'checkmate' ? (
                        <ExamGraph
                            data={getUserExamRatingsByType(user, ExamType.Polgar)}
                            label='Checkmate Test'
                            color='#5905a3'
                            isPR={true}
                            xLabels={getUserExamCreationTimes(user, ExamType.Polgar)}
                            isUserProv={isProvisional}
                            checkProvLine={checkProvLine}
                            realRating={realRating}
                            width={width}
                            height={height}
                        />
                    ) : graphpicker === 'prfive' ? (
                        <ExamGraph
                            data={puzzleRush5data}
                            label='Puzzle 5 Min'
                            color='#0d04bf'
                            isPR={false}
                            xLabels={puzzleRush5Timeline}
                            width={width}
                            isUserProv={isProvisional}
                            checkProvLine={checkProvLine}
                            realRating={realRating}
                            height={height}
                        />
                    ) : (
                        <ExamGraph
                            data={puzzleSurvdata}
                            label='Puzzle Survival'
                            color='#e44cf5'
                            xLabels={puzzleSurTimeline}
                            isUserProv={isProvisional}
                            isPR={false}
                            checkProvLine={checkProvLine}
                            realRating={realRating}
                            width={width}
                            height={height}
                        />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ExamGraphComposer;
