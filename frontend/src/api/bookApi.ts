import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

/**
 * Book API
 *
 * I put this all here because I didn't want to touch the backend code, but maybe some of it should
 * move to the backend.
 */

// Credentials are hard-coded in a separate file like so:
//
// export const credentials = {
//     accessKeyId: "XXXXXXXXXXXX",
//     secretAccessKey: "XXXXXXXXXXXXX",
// }
import { credentials } from './bookApiCredentials'

const dynamo = new DynamoDB({
    region: 'us-east-1',
    apiVersion: "2010-12-01",
    credentials,
});
