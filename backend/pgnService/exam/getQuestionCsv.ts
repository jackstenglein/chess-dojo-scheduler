import {
    AttributeValue,
    BatchGetItemCommand,
    DynamoDBClient,
    GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { Chess } from '@jackstenglein/chess';
import {
    Exam,
    ExamAnswer,
    ExamType,
} from '@jackstenglein/chess-dojo-common/src/database/exam';
import {
    getOrientation,
    initializeSolution,
    scoreVariation,
} from '@jackstenglein/chess-dojo-common/src/exam/scores';
import * as fs from 'fs';

const dynamo = new DynamoDBClient({ region: 'us-east-1' });
const examTable = process.env.stage + '-exams';

const examType = ExamType.Tactics;
const examId = '889b5c6f-9f0b-4bde-88ae-a7e5ff629ebc';

async function getAnswers(exam: Exam): Promise<ExamAnswer[]> {
    let keys: Record<string, AttributeValue>[] = [];
    const result: ExamAnswer[] = [];

    for (const id of Object.keys(exam.answers)) {
        keys.push({ type: { S: id }, id: { S: exam.id } });

        if (keys.length === 100) {
            const output = await dynamo.send(
                new BatchGetItemCommand({
                    RequestItems: {
                        [examTable]: {
                            Keys: keys,
                        },
                    },
                }),
            );

            for (const item of output.Responses![examTable]) {
                result.push(unmarshall(item) as ExamAnswer);
            }

            keys = [];
        }
    }

    if (keys.length > 0) {
        const output = await dynamo.send(
            new BatchGetItemCommand({
                RequestItems: {
                    [examTable]: {
                        Keys: keys,
                    },
                },
            }),
        );

        for (const item of output.Responses![examTable]) {
            result.push(unmarshall(item) as ExamAnswer);
        }
    }

    return result;
}

function writeCsvs(exam: Exam, answers: ExamAnswer[]) {
    for (let i = 0; i < exam.pgns.length; i++) {
        const stream = fs.createWriteStream(`problem-${i}.csv`);
        stream.write(`Username,Rating,Cohort,Score\n`);

        const pgn = exam.pgns[i];
        const problemChess = new Chess({ pgn });
        initializeSolution(problemChess);

        for (const answer of answers) {
            const userPgn = answer.attempts[0]?.answers[i].pgn;
            if (!userPgn) {
                continue;
            }

            const userChess = new Chess({ pgn: userPgn });
            userChess.seek(null);
            const score = scoreVariation(
                getOrientation(problemChess),
                problemChess.history(),
                null,
                userChess,
                false,
            )[0];

            stream.write(
                `${answer.type},${answer.attempts[0].rating},${answer.attempts[0].cohort},${score}\n`,
            );
        }

        stream.close();
    }
}

async function main() {
    try {
        const output = await dynamo.send(
            new GetItemCommand({
                Key: {
                    type: { S: examType },
                    id: { S: examId },
                },
                TableName: examTable,
            }),
        );

        const exam = unmarshall(output.Item!) as Exam;
        const answers = await getAnswers(exam);
        console.log('Got %d answers', answers.length);
        writeCsvs(exam, answers);
    } catch (err) {
        console.error('Failed to produce CSV: ', err);
    }
}

main();
