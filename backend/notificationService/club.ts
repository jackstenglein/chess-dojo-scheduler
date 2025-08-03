import {
    ClubJoinRequestApprovedEvent,
    ClubJoinRequestEvent,
    NotificationTypes,
} from '@jackstenglein/chess-dojo-common/src/database/notification';
import { dynamo, UpdateItemBuilder } from '../directoryService/database';
import { getNotificationSettings } from './user';

const notificationTable = `${process.env.stage}-notifications`;

/**
 * Creates notifications for requests to join clubs.
 * @param event The event to create notifications for.
 */
export async function handleClubJoinRequest(event: ClubJoinRequestEvent) {
    const user = await getNotificationSettings(event.owner);
    if (!user) {
        return;
    }

    const input = new UpdateItemBuilder()
        .key('username', event.owner)
        .key('id', `${NotificationTypes.NEW_CLUB_JOIN_REQUEST}|${event.id}`)
        .set('type', NotificationTypes.NEW_CLUB_JOIN_REQUEST)
        .set('updatedAt', new Date().toISOString())
        .set('clubMetadata', {
            id: event.id,
            name: event.name,
        })
        .add('count', 1)
        .table(notificationTable)
        .build();
    await dynamo.send(input);
    console.log(
        `Successfully created ${NotificationTypes.NEW_CLUB_JOIN_REQUEST} notification for ${event.owner}`,
    );
}

/**
 * Creates notifications for approved requests to join a club.
 * @param event The event to create notifications for.
 */
export async function handleClubJoinRequestApproved(event: ClubJoinRequestApprovedEvent) {
    const user = await getNotificationSettings(event.username);
    if (!user) {
        return;
    }

    const input = new UpdateItemBuilder()
        .key('username', event.username)
        .key('id', `${NotificationTypes.CLUB_JOIN_REQUEST_APPROVED}|${event.id}`)
        .set('type', NotificationTypes.CLUB_JOIN_REQUEST_APPROVED)
        .set('updatedAt', new Date().toISOString())
        .set('clubMetadata', {
            id: event.id,
            name: event.name,
        })
        .add('count', 1)
        .table(notificationTable)
        .build();
    await dynamo.send(input);
    console.log(
        `Successfully created ${NotificationTypes.CLUB_JOIN_REQUEST_APPROVED} notification for ${event.username}`,
    );
}
