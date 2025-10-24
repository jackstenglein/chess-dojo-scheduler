import {
    NotificationEventTypes,
    SubscriptionCreatedEvent,
} from '@jackstenglein/chess-dojo-common/src/database/notification';
import { sendEmailTemplate } from './email';
import { getNotificationSettings } from './user';

/**
 * Sends an email notification for a user starting a subscription.
 * @param event The event to send the email for.
 */
export async function handleSubscriptionCreated(event: SubscriptionCreatedEvent) {
    const user = await getNotificationSettings(event.username);
    if (!user || user.notificationSettings?.emailNotificationSettings?.disableSubscriptionCreated) {
        return;
    }

    await sendEmailTemplate(
        'subscription/subscriptionCreated',
        { name: user.displayName },
        [user.email],
        'ChessDojo <welcome@mail.chessdojo.club>',
    );
    console.log(
        `Successfully sent email to ${user.username} for ${NotificationEventTypes.SUBSCRIPTION_CREATED}`,
    );
}
