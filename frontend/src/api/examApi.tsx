import axios, { AxiosResponse } from 'axios';
import { getConfig } from '../config';
import { Exam, ExamAnswer, ExamAttempt, ExamType } from '../database/exam';

const BASE_URL = getConfig().api.baseUrl;

export type ExamApiContextType = {
    /**
     * Fetches a list of exams with the provided type.
     * @param type The type of exam to fetch.
     * @param startKey The start key to use when fetching.
     * @returns A list of exams with the provided type.
     */
    listExams: (type: ExamType, startKey?: string) => Promise<Exam[]>;

    /**
     * Saves the provided exam attempt in the database.
     * @param examType The type of the exam attempted.
     * @param examId The id of the exam attempted.
     * @param attempt The attempt to save.
     * @returns An AxiosResponse containing the updated Exam or null if this
     * ExamAttempt did not generate an update to the Exam.
     */
    putExamAttempt: (
        examType: ExamType,
        examId: string,
        attempt: ExamAttempt,
    ) => Promise<AxiosResponse<Exam | null>>;

    /**
     * Fetches an exam answer created by the calling user.
     * @param id The id of the exam to fetch the answer for.
     * @returns An AxiosResponse containing the requested ExamAnswer.
     */
    getExamAnswer: (id: string) => Promise<AxiosResponse<ExamAnswer>>;
};

interface ListExamsResponse {
    exams: Exam[];
    lastEvaluatedKey: string;
}

/**
 * Fetches a list of exams with the provided type.
 * @param idToken The id token of the current signed-in user.
 * @param type The type of exam to list.
 * @param startKey The start key to use when fetching.
 * @returns A list of exams with the provided type.
 */
export async function listExams(idToken: string, type: ExamType, startKey?: string) {
    const params = { type, startKey };
    const result: Exam[] = [];

    do {
        const resp = await axios.get<ListExamsResponse>(`${BASE_URL}/exams`, {
            params,
            headers: {
                Authorization: `Bearer ${idToken}`,
            },
        });

        result.push(...resp.data.exams);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * Saves the provided exam attempt in the database.
 * @param idToken The id token of the current signed-in user.
 * @param examType The type of the exam attempted.
 * @param examId The id of the exam attempted.
 * @param attempt The attempt to save.
 * @returns An AxiosResponse containing the updated Exam or null if this
 * ExamAttempt did not generate an update to the Exam.
 */
export function putExamAttempt(
    idToken: string,
    examType: ExamType,
    examId: string,
    attempt: ExamAttempt,
) {
    return axios.put<Exam>(
        `${BASE_URL}/exams/answers`,
        { examType, examId, attempt },
        {
            headers: { Authorization: `Bearer ${idToken}` },
        },
    );
}

/**
 * Fetches an exam answer created by the calling user.
 * @param idToken The id token of the current signed-in user.
 * @param id The id of the exam to fetch the answer for.
 * @returns An AxiosResponse containing the requested ExamAnswer.
 */
export function getExamAnswer(idToken: string, id: string) {
    return axios.get<ExamAnswer>(`${BASE_URL}/exams/answers?id=${id}`, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}
