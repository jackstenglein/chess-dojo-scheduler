
import { User } from "../../database/user";
import { ExamType } from "../../database/exam";
import ExamGraph from "./ExamGraph";
import React from "react";
import { toDojoDateString } from '../../calendar/displayDate';
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
    if(Object.keys(user.exams).length == 0){
        console.log("No Exam Found!");
        return [];
    }
    return Object.values(user.exams)
        .filter(examSummary => examSummary.examType === examType)
        .map(examSummary => Math.round(examSummary.rating)).reverse();
}

/**
 * Gets the list of user's exam creation times from the exams field.
 * @param user - The user object containing exam summaries.
 * @returns A list of exam creation times.
 */
function getUserExamCreationTimes(user: User): string[] {
    if(Object.keys(user.exams).length == 0){
        console.log("No Exam Found!");
        return [];
    }
    return Object.values(user.exams).map(examSummary => toDojoDateString(new Date(examSummary.createdAt), user.timezoneOverride)).reverse();
}

interface ExamComposer {
    user: User
    width: number
    height: number
}


const ExamGraphComposer: React.FC<ExamComposer> = ({user, width, height}) => {

    console.log(getUserExamRatingsByType(user, ExamType.Polgar));
    console.log(getUserExamRatingsByType(user, ExamType.Tactics));
    console.log(getUserExamRatingsByType(user, ExamType.Endgame));

    return (
        
        <ExamGraph polgarData={getUserExamRatingsByType(user, ExamType.Polgar)} tacData={getUserExamRatingsByType(user, ExamType.Tactics)} 
        endgameData={getUserExamRatingsByType(user, ExamType.Endgame)} xLabels={getUserExamCreationTimes(user)} width={width} height={height}/>

    );
};

export default ExamGraphComposer;



