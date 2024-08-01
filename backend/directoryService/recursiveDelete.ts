import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import {
    DirectoryItemTypes,
    DirectorySchema,
} from '@jackstenglein/chess-dojo-common/src/database/directory';
import { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';
import { deleteDirectory } from './delete';

/**
 * Handles DynamoDB stream events for items deleted from the directory table.
 * Each directory in the stream will have its subdirectories deleted. Those
 * deleted subdirectories will then enter this same stream and their subdirectories
 * will be deleted. This will continue recursively until all children of the
 * original directory are deleted.
 * @param event The DynamoDB stream event that triggered the function.
 */
export const handler: DynamoDBStreamHandler = async (event) => {
    for (const record of event.Records) {
        await processRecord(record);
    }
};

/**
 * Processes a single deleted directory and deletes all of its immediate subdirectories.
 * @param record The DynamoDB stream record for the deleted directory.
 */
async function processRecord(record: DynamoDBRecord) {
    try {
        console.log('Processing record %j', record);
        const directory = DirectorySchema.parse(
            unmarshall(record.dynamodb?.OldImage as Record<string, AttributeValue>),
        );
        for (const item of Object.values(directory.items)) {
            if (item.type === DirectoryItemTypes.DIRECTORY) {
                await deleteDirectory(directory.owner, item.id);
                console.log(`Deleted subdirectory ${item.id}`);
            }
        }
    } catch (err) {
        console.error('Failed to process record %j: ', record, err);
    }
}
