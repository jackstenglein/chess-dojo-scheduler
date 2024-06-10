import axios, { AxiosResponse } from 'axios';
import { getConfig } from '../config';
import { Exam, ExamAnswer, ExamAttempt, ExamType } from '../database/exam';

const BASE_URL = getConfig().api.baseUrl;

export interface ExamApiContextType {
    /**
     * Fetches the requested exam, as well as the calling user's answer for it.
     * @param type The type of the exam.
     * @param id The id of the exam.
     * @returns The requested exam and answer, if it exists.
     */
    getExam: (
        type: ExamType,
        id: string,
    ) => Promise<AxiosResponse<{ exam: Exam; answer?: ExamAnswer }>>;

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
     * @param index The index of the attempt, if it already exists.
     * @param totalScore The user's total score on the attempt, if it is completed.
     * @returns An AxiosResponse containing the updated Exam or null if this
     * ExamAttempt did not generate an update to the Exam.
     */
    putExamAttempt: (
        examType: ExamType,
        examId: string,
        attempt: ExamAttempt,
        index?: number,
        totalScore?: number,
    ) => Promise<AxiosResponse<{ exam?: Exam; answer: ExamAnswer }>>;

    /**
     * Fetches an exam answer created by the calling user.
     * @param id The id of the exam to fetch the answer for.
     * @returns An AxiosResponse containing the requested ExamAnswer.
     */
    getExamAnswer: (id: string) => Promise<AxiosResponse<ExamAnswer>>;
}

/**
 * Fetches the requested exam, as well as the calling user's answer for it.
 * @param idToken The id token of the current signed-in user.
 * @param type The type of the exam.
 * @param id The id of the exam.
 * @returns The requested exam and answer, if it exists.
 */
export function getExam(idToken: string, type: ExamType, id: string) {
    return axios.get<{ exam: Exam; answer?: ExamAnswer }>(
        `${BASE_URL}/exams/${type}/${id}`,
        { headers: { Authorization: `Bearer ${idToken}` } },
    );
}

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
 * @param index The index of the attempt, if it already exists.
 * @param totalScore The user's total score on the attempt, if it is completed.
 * @returns An AxiosResponse containing the updated Exam or null if this
 * ExamAttempt did not generate an update to the Exam.
 */
export function putExamAttempt(
    idToken: string,
    examType: ExamType,
    examId: string,
    attempt: ExamAttempt,
    index?: number,
    totalScore?: number,
) {
    return axios.put<{ exam?: Exam; answer: ExamAnswer }>(
        `${BASE_URL}/exams/answers`,
        { examType, examId, attempt, index, totalScore },
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
