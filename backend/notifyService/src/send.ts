'use strict';

import { Context, SQSEvent, SQSHandler } from 'aws-lambda';

import { Notification } from '@jackstenglein/chess-dojo-common/src/database/notification';

async function handleOne(notice: Notification) {
    console.log(`Processed message ${notice}`);
}

export const handler: SQSHandler = async (
    event: SQSEvent,
    context: Context,
): Promise<void> => {
    for (const message of event.Records) {
        try {
            const notice = deserialize(message.body);
            await handleOne(notice);
        } catch (err) {
            // TODO: Put in dead letter queue
            console.error('An error occurred', message);
        }
    }
};

export function deserialize(unsafe: string): Notification {
    return Notification.parse(JSON.parse(unsafe));
}

export function serialize(notice: Notification): string {
    return JSON.stringify(notice);
}
