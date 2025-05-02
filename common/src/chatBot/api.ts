import { z } from 'zod';

/** Verifies a request to send a chat message to the bot. */
export const ChatRequestSchema = z.object({
    /** The message to send to the bot. */
    message: z.string(),
    /** The ID of the thread to send the message in. */
    threadId: z.string(),
    /** The user's ID the thread belongs to. */
    resourceId: z.string(),
});

/** A request to send a chat message to the bot. */
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** The response from the bot to a chat request. */
export interface ChatResponse {
    /** The content of the response. */
    text: string;
}

/** Verifies a request to get the bot message history. */
export const GetChatHistoryRequestSchema = z.object({
    /** The ID of the thread to get the messages from. */
    threadId: z.string(),
});

/** A request to get the bot message history. */
export type GetChatHistoryRequest = z.infer<typeof GetChatHistoryRequestSchema>;

/** The response from a GetChatHistory request. */
export interface GetChatHistoryResponse {
    /** The messages in the history. */
    messages: Message[];
}

/** A single message sent to/from the bot. */
export interface Message {
    /** The id of the message. */
    id: string;
    /** The role of the sender. */
    role: 'user' | 'assistant';
    /** The content of the message. */
    content: string;
    /** The date the message was created. */
    createdAt: string;
    /** Currently required by the Mastra backend, but we never set any values. */
    toolInvocations: never[];
}
