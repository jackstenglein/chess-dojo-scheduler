import { _Object, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { SubscriptionTier } from '@jackstenglein/chess-dojo-common/src/database/user';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { errToApiGatewayProxyResultV2, success } from '../directoryService/api';

const S3_BUCKET = process.env.s3Bucket;
const S3_CLIENT = new S3Client({ region: 'us-east-1' });
const S3_KEY_REGEX = new RegExp(
    `^(${SubscriptionTier.GameReview}|${SubscriptionTier.Lecture})/(.*)/(.*) \\((\\d{4}-\\d{2}-\\d{2}).*\\)$`,
);

interface LiveClass {
    name: string;
    type: SubscriptionTier.GameReview | SubscriptionTier.Lecture;
    recordings: {
        date: string;
        s3Key: string;
    }[];
}

/**
 * Returns a list of class recordings found in S3.
 * @param event The event that triggered the lambda.
 * @returns A list of class recordings found in S3.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        console.log('Event: ', event);

        const command = new ListObjectsV2Command({ Bucket: S3_BUCKET });
        const response = await S3_CLIENT.send(command);

        const classMap: Record<string, LiveClass> = {};
        for (const item of response.Contents ?? []) {
            processItem(item, classMap);
        }

        const classes = Object.values(classMap).sort((lhs, rhs) =>
            lhs.recordings[0].date.localeCompare(rhs.recordings[0].date),
        );
        return success({ classes });
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Adds the S3 item to the classes map. If the item does not match
 * S3_KEY_REGEX, it will be skipped.
 * @param item The item to add to the classes map.
 * @param classes The map of classes already found.
 */
function processItem(item: _Object, classes: Record<string, LiveClass>) {
    const matches = S3_KEY_REGEX.exec(item.Key ?? '');
    if (!matches || matches.length < 5) {
        console.error(`Failed to match S3_KEY_REGEX on item ${item.Key}`);
        return;
    }

    const [_, classType, folder, name, date] = matches;
    if (classType !== SubscriptionTier.GameReview && classType !== SubscriptionTier.Lecture) {
        console.error(`Unknown class type ${classType} for item ${item.Key}`);
        return;
    }

    if (!classes[folder]) {
        classes[folder] = { name, type: classType, recordings: [] };
    }
    classes[folder].recordings.push({ date, s3Key: item.Key ?? '' });
}
