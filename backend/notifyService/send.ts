import { SQSEvent, Context, SQSHandler, SQSRecord } from "aws-lambda";

async function handleOne(message: SQSRecord) {
        console.log(`Processed message ${message.body}`);
}

export const handler: SQSHandler = async (
        event: SQSEvent,
        context: Context
): Promise<void> => {
        for (const message of event.Records) {
                try {
                        await handleOne(message);
                } catch (err) {
                        console.error("An error occurred", message);
                }
        }
};
