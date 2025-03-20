import {
    EventBookedEvent,
    NotificationEventTypes,
} from '@jackstenglein/chess-dojo-common/src/database/notification';
import { getGuildMember, sendDirectMessage } from './discord';
import { getNotificationSettings } from './user';

const frontendHost = process.env.frontendHost;

/**
 * Creates notifications for EventBookedEvents (booked meetings on the calendar).
 * @param event The event to create notifications for.
 */
export async function handleEventBooked(event: EventBookedEvent) {
    const user = await getNotificationSettings(event.owner);
    if (!user) {
        return;
    }

    if (
        user.discordUsername &&
        !user.notificationSettings.discordNotificationSettings?.disableMeetingBooking
    ) {
        const member = await getGuildMember(user.discordUsername);
        await sendDirectMessage(member.user.id, messageText(event));
        console.log(
            `Successfully sent Discord message to ${user.username} for ${NotificationEventTypes.EVENT_BOOKED}`,
        );
    }
}

/**
 * Returns the text of the notification message for the given event.
 * @param event The event to get the notification text for.
 */
function messageText(event: EventBookedEvent): string {
    if (event.isGroup) {
        return `Hello, someone just joined your group meeting! View it [**here**](<${frontendHost}/meeting/${event.id}>)`;
    }
    return `Hello, someone has just booked a meeting with you! View it [**here**](<${frontendHost}/meeting/${event.id}>).`;
}
