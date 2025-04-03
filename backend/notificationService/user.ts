import { GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { User } from '@jackstenglein/chess-dojo-common/src/database/user';
import { dynamo } from 'chess-dojo-directory-service/database';

const userTable = `${process.env.stage}-users`;

export type PartialUser = Pick<
    User,
    'username' | 'discordId' | 'discordUsername' | 'notificationSettings'
> & { email: string };

/**
 * Gets the notification settings of the user with the provided username from the database.
 * @param username The username to fetch.
 * @returns The user or undefined if not found.
 */
export async function getNotificationSettings(username: string): Promise<PartialUser | undefined> {
    const getUserOutput = await dynamo.send(
        new GetItemCommand({
            Key: {
                username: { S: username },
            },
            ProjectionExpression: `username, email, discordId, discordUsername, notificationSettings`,
            TableName: userTable,
        }),
    );
    if (!getUserOutput.Item) {
        return undefined;
    }
    return unmarshall(getUserOutput.Item) as PartialUser;
}
