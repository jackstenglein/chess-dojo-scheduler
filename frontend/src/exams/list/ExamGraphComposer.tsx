import { Card, CardContent, Stack, Typography } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React from 'react';
import { useRequirements } from '../../api/cache/requirements';
import { toDojoDateString } from '../../calendar/displayDate';
import { ExamType } from '../../database/exam';
import { ALL_COHORTS, User } from '../../database/user';
import {
    PuzzleRush5MinReqId,
    PuzzleSurvivalReqId,
    calculateTacticsRating,
    getTaskRating,
    getTaskRatingSingleCount,
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
    const getFinal: number[] = [];

    Object.values(user.exams)
        .filter((examSummary) => examSummary.examType === examType)
        .map((examSummary) => getFinal.push(examSummary.rating));

    return getFinal.map((num) => parseInt(num.toString()));
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
    const realRating = Math.round(tacticsRating.overall);
    const [graphpicker, setGraphPicker] = React.useState<
        'tactics' | 'checkmate' | 'prfive' | 'prsuv'
    >('tactics');
    const [yaxis, setYaxis] = React.useState<'score' | 'rating'>('rating');
    const puzzleRush5data: number[] = [];
    const puzzleRush5Rating: number[] = [];
    const puzzleSurvRating: number[] = [];
    const puzzleSurvdata: number[] = [];
    const puzzleRush5Timeline: string[] = [];
    const puzzleSurTimeline: string[] = [];
    const puzzlePushOverallRating = parseInt(
        getTaskRating(
            user,
            requirements.find((r) => r.id === PuzzleRush5MinReqId),
        ).toString(),
    );
    const puzzleSurvOverallRating = parseInt(
        getTaskRating(
            user,
            requirements.find((r) => r.id === PuzzleSurvivalReqId),
        ).toString(),
    );

    const timeline = useTimeline(user.username);

    Object.values(timeline.entries).map((his) => {
        if (his.requirementId === PuzzleRush5MinReqId) {
            puzzleRush5Timeline.push(
                toDojoDateString(new Date(his.createdAt), user.timezoneOverride),
            );
            puzzleRush5Rating.push(
                getTaskRatingSingleCount(
                    requirements.find((r) => r.id === PuzzleRush5MinReqId),
                    his.newCount,
                ),
            );
            puzzleRush5data.push(his.newCount);
        } else if (his.requirementId === PuzzleSurvivalReqId) {
            puzzleSurTimeline.push(
                toDojoDateString(new Date(his.createdAt), user.timezoneOverride),
            );
            puzzleSurvdata.push(his.newCount);
            puzzleSurvRating.push(
                getTaskRatingSingleCount(
                    requirements.find((r) => r.id === PuzzleSurvivalReqId),
                    his.newCount,
                ),
            );
        }
    });

    const sumRush = puzzleRush5data.reduce((sum, value) => sum + value, 0);
    const averageRush = sumRush / puzzleRush5data.length;
    const sumSur = puzzleSurvdata.reduce((sum, value) => sum + value, 0);
    const avgSur = sumSur / puzzleSurvdata.length;

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
                    <TextField
                        select
                        sx={{ minWidth: 150 }}
                        label='Pick PR y-axis'
                        value={yaxis}
                        disabled={
                            graphpicker === 'tactics' || graphpicker === 'checkmate'
                        }
                        onChange={(event) =>
                            setYaxis(event.target.value as 'rating' | 'score')
                        }
                    >
                        <MenuItem value='score'> Score </MenuItem>
                        <MenuItem value='rating'> Rating</MenuItem>
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
                            displayDiffText='Overall Rating'
                            xLabels={getUserExamCreationTimes(user, ExamType.Tactics)}
                            width={width}
                            realRating={realRating}
                            height={height}
                        />
                    ) : graphpicker === 'checkmate' ? (
                        <ExamGraph
                            data={getUserExamRatingsByType(user, ExamType.Polgar)}
                            label='Checkmate Test'
                            color='#5905a3'
                            displayDiffText='Overall Rating'
                            xLabels={getUserExamCreationTimes(user, ExamType.Polgar)}
                            realRating={realRating}
                            width={width}
                            height={height}
                        />
                    ) : graphpicker === 'prfive' && yaxis === 'rating' ? (
                        <ExamGraph
                            data={puzzleRush5Rating}
                            label='Puzzle 5 Min Rating'
                            color='#0d04bf'
                            displayDiffText='Overall Rating'
                            xLabels={puzzleRush5Timeline}
                            width={width}
                            realRating={puzzlePushOverallRating}
                            height={height}
                        />
                    ) : graphpicker === 'prsuv' && yaxis === 'rating' ? (
                        <ExamGraph
                            data={puzzleSurvRating}
                            label='Puzzle Survival Rating'
                            color='#e44cf5'
                            xLabels={puzzleSurTimeline}
                            displayDiffText='Overall Rating'
                            realRating={puzzleSurvOverallRating}
                            width={width}
                            height={height}
                        />
                    ) : graphpicker === 'prsuv' && yaxis === 'score' ? (
                        <ExamGraph
                            data={puzzleSurvdata}
                            label='Puzzle Survival Score'
                            color='#e44cf5'
                            xLabels={puzzleSurTimeline}
                            displayDiffText='Avg Score'
                            realRating={avgSur}
                            width={width}
                            height={height}
                        />
                    ) : graphpicker === 'prfive' && yaxis === 'score' ? (
                        <ExamGraph
                            data={puzzleRush5data}
                            label='Puzzle 5 Min Score'
                            color='#0d04bf'
                            displayDiffText='Avg Score'
                            xLabels={puzzleRush5Timeline}
                            width={width}
                            realRating={averageRush}
                            height={height}
                        />
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ExamGraphComposer;
