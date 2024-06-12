import { useAuth } from "../../auth/Auth";
import { useRequiredAuth } from "../../auth/Auth";

import { User } from "../../database/user";
import { ExamType } from "../../database/exam";
import ExamGraph from "./ExamGraph";
import React from "react";
/**
 * Gets the list of user's exam ratings from the exams field.
 * @param user - The user object containing exam summaries.
 * @returns A list of exam ratings.
 */
function getUserExamRatings(user: User): number[] {
    return Object.values(user.exams).map(examSummary => examSummary.rating);
}


/**
 * Gets the list of user's exam ratings filtered by exam type.
 * @param user - The user object containing exam summaries.
 * @param examType - The type of exam to filter by.
 * @returns A list of exam ratings for the specified exam type.
 */
function getUserExamRatingsByType(user: User, examType: ExamType): number[] {
    return Object.values(user.exams)
        .filter(examSummary => examSummary.examType === examType)
        .map(examSummary => examSummary.rating);
}

/**
 * Gets the list of user's exam creation times from the exams field.
 * @param user - The user object containing exam summaries.
 * @returns A list of exam creation times.
 */
function getUserExamCreationTimes(user: User): string[] {
    return Object.values(user.exams).map(examSummary => examSummary.createdAt);
}


const ExamGraphComposer: React.FC = () => {

    const auth = useRequiredAuth();
    const user = auth.user;

    return (

        <ExamGraph polgarData={getUserExamRatingsByType(user, ExamType.Polgar)} tacData={getUserExamRatingsByType(user, ExamType.Polgar)} 
        endgameData={getUserExamRatingsByType(user, ExamType.Endgame)} xLabels={getUserExamCreationTimes(user)} width={300} height={300}/>

    );
};

export default ExamGraphComposer;



