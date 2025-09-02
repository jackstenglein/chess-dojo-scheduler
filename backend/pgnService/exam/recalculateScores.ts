import {
    AttributeValue,
    DynamoDBClient,
    GetItemCommand,
    UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import {
    Exam,
    ExamAnswer,
    ExamAnswerSummary,
    isValidExamType,
} from '@jackstenglein/chess-dojo-common/src/database/exam';
import {
    getExamMaxScore,
    getOrientation,
    initializeSolution,
    scoreVariation,
} from '@jackstenglein/chess-dojo-common/src/exam/scores';
import { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const examTable = process.env.stage + '-exams';

export const handler: DynamoDBStreamHandler = async (event) => {
    console.log('Event: %j', event);

    const promises: Promise<void>[] = [];
    for (const record of event.Records) {
        promises.push(processRecord(record));
    }
    await Promise.all(promises);
};

async function processRecord(record: DynamoDBRecord) {
    if (!record.dynamodb?.OldImage || !record.dynamodb.NewImage) {
        console.log('Old/new image is undefined, skipping record');
        return;
    }

    const oldExam = unmarshall(
        record.dynamodb.OldImage as Record<string, AttributeValue>,
    ) as Exam;
    const newExam = unmarshall(
        record.dynamodb.NewImage as Record<string, AttributeValue>,
    ) as Exam;

    if (!isValidExamType(oldExam.type) || !isValidExamType(newExam.type)) {
        console.log('Not an exam, skipping record');
        return;
    }

    if (oldExam.pgns.every((pgn, i) => pgn === newExam.pgns[i])) {
        console.log('No PGNs changed, skipping record');
        return;
    }

    const totalScore = getExamMaxScore(newExam);

    const problemChesses = newExam.pgns.map((pgn) => {
        const chess = new Chess({ pgn });
        initializeSolution(chess);
        return chess;
    });

    const updates: Promise<string>[] = [];
    for (const [username, answer] of Object.entries(newExam.answers)) {
        updates.push(recalculateScore(username, answer, newExam, problemChesses));
    }
    const updatedUsers = (await Promise.all(updates)).filter((u) => u);
    if (updatedUsers.length === 0 && totalScore === oldExam.totalScore) {
        console.log('No updated users and no update to total score');
        return;
    }

    newExam.totalScore = totalScore;
    await saveUpdates(updatedUsers, newExam);
}

async function recalculateScore(
    username: string,
    answerSummary: ExamAnswerSummary,
    newExam: Exam,
    problemChesses: Chess[],
) {
    const answer = await getExamAnswer(username, newExam.id);
    if (!answer) {
        return '';
    }

    let totalScore = 0;

    problemChesses.forEach((chess, i) => {
        const userPgn = answer.attempts[0]?.answers[i].pgn;
        if (!userPgn) {
            return;
        }

        const userChess = new Chess({ pgn: userPgn });
        userChess.seek(null);
        totalScore += scoreVariation(
            getOrientation(chess),
            chess.history(),
            null,
            userChess,
            false,
        )[0];
    });

    if (totalScore === answerSummary.score) {
        return '';
    }

    answerSummary.score = totalScore;
    console.log('New Score: ', answerSummary.score);
    return username;
}

/**
 * Fetches the ExamAnswer with the provided username and exam ID from Dynamo.
 * @param username The username of the person who answered the exam.
 * @param examId The ID of the exam.
 * @returns The requested ExamAnswer or null if it does not exist.
 */
async function getExamAnswer(
    username: string,
    examId: string,
): Promise<ExamAnswer | null> {
    const getItemOutput = await dynamo.send(
        new GetItemCommand({
            Key: {
                type: { S: username },
                id: { S: examId },
            },
            TableName: examTable,
        }),
    );

    if (!getItemOutput.Item) {
        return null;
    }

    const answer = unmarshall(getItemOutput.Item);
    return answer as ExamAnswer;
}

/**
 * Updates the provided list of usernames on the provided exam in Dynamo.
 * The exam answers should contain the updated answers to save in Dynamo.
 * @param updatedUsers The usernames to update.
 * @param newExam The exam to update.
 */
async function saveUpdates(updatedUsers: string[], newExam: Exam) {
    let updateExpression = 'SET #totalScore = :totalScore, ';
    const exprAttrValues: Record<string, AttributeValue> = {
        ':totalScore': { N: `${newExam.totalScore}` },
    };
    const exprAttrNames: Record<string, string> = {
        '#totalScore': 'totalScore',
    };

    if (updatedUsers.length > 0) {
        exprAttrNames['#answers'] = 'answers';
    }
    for (let i = 0; i < updatedUsers.length; i++) {
        updateExpression += `#answers.#u${i} = :u${i}, `;
        exprAttrValues[`:u${i}`] = { M: marshall(newExam.answers[updatedUsers[i]]) };
        exprAttrNames[`#u${i}`] = updatedUsers[i];
    }
    updateExpression = updateExpression.substring(
        0,
        updateExpression.length - ', '.length,
    );

    const input = new UpdateItemCommand({
        Key: {
            type: { S: newExam.type },
            id: { S: newExam.id },
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        TableName: examTable,
        ReturnValues: 'NONE',
    });

    try {
        await dynamo.send(input);
    } catch (err) {
        console.error('ERROR: Failed to update exam with input %j: ', input, err);
    }
}
