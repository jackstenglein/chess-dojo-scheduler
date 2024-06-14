import { Card, CardContent, Stack, Typography } from '@mui/material';
import React from 'react';
import { toDojoDateString } from '../../calendar/displayDate';
import { ExamType } from '../../database/exam';
import { User } from '../../database/user';
import ExamGraph from './ExamGraph';
import { useRequirements } from '../../api/cache/requirements';
import { ALL_COHORTS} from '../../database/user';
import { calculateTacticsRating } from '../../exams/view/exam';
import { TacticsRatingComponent } from '../view/exam';




/**
 * Gets the list of user's exam ratings filtered by exam type.
 * @param user - The user object containing exam summaries.
 * @param examType - The type of exam to filter by.
 * @returns A list of exam ratings for the specified exam type.
 */
function getUserExamRatingsByType(user: User, examType: ExamType): number[] {
    return Object.values(user.exams)
        .filter((examSummary) => examSummary.examType === examType)
        .map((examSummary) => Math.round(examSummary.rating))
        .reverse();
}

/**
 * Gets the list of user's exam creation times from the exams field.
 * @param user - The user object containing exam summaries.
 * @returns A list of exam creation times.
 */
function getUserExamCreationTimes(user: User): string[] {
    return Object.values(user.exams)
        .map((examSummary) =>
            toDojoDateString(new Date(examSummary.createdAt), user.timezoneOverride),
        )
        .reverse();
}


/**
 * gets the users progress PR ratings
 * @param user user 
 * @param type the PR task name
 * @returns 
 */
function getUserExamRatingByProgress(user: User, type: string): number[]{
    const { requirements } = useRequirements(ALL_COHORTS, true);
    const tacticsRating = calculateTacticsRating(user, requirements);
    const isProvisional = tacticsRating.components.some((c) => c.rating < 0);

    if(!isProvisional){
        return Object.values(tacticsRating.components).filter((f) => f.name === type).map((c) => (c.rating));
        
    }

    return [];
}

/**
 * Gets the the color for the exam component
 * @param t TacticsRatingCompontent
 * @returns hexcode color
 */
export function getExamColour(t: TacticsRatingComponent): string {
    if(t.name.includes("Polgar Mate Tests")){
        return "#8c03fc"
    }else if(t.name.includes("Tactics Tests")){
        return "#038cfc"
    }else if(t.name.includes("Endgame Tests")){
        return "#76d404"
    }else if(t.name.includes("PR 5 Min")){
        return "#c9f03c"
    }else if(t.name.includes("PR Survival")){
        return "#ab3cf0"
    }

    return "#4b4d49"
}

interface ExamComposer {
    user: User;
    width: number;
    height: number;
}

const ExamGraphComposer: React.FC<ExamComposer> = ({ user, width, height }) => {
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
                    <ExamGraph
                        polgarData={getUserExamRatingsByType(user, ExamType.Polgar)}
                        tacData={getUserExamRatingsByType(user, ExamType.Tactics)}
                        endgameData={getUserExamRatingsByType(user, ExamType.Endgame)}
                        pr5min={getUserExamRatingByProgress(user, 'PR 5 Min')}
                        prsuv={getUserExamRatingByProgress(user, 'PR Survival')}
                        xLabels={getUserExamCreationTimes(user)}
                        width={width}
                        height={height}
                    />
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ExamGraphComposer;
