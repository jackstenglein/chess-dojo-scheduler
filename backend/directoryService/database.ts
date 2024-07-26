'use strict';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const dynamo = new DynamoDBClient({ region: 'us-east-1' });
export const directoryTable = process.env.stage + '-directories';
