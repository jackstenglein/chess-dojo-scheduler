import axios, { AxiosResponse } from 'axios';

import { getConfig } from '../config';

const BASE_URL = getConfig().api.baseUrl;

interface AgentHistoryResponse {
    uiMessages: UIMessage[];
}

interface AgentChatResponse {
    text: string;
}

export interface UIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    toolInvocations: unknown[];
}

/**
 * sends a message to DojoAI
 * @param message the message content
 * @param threadId the message's thread
 * @param resourceId the user the message belonds to
 * @returns an Axios Response containing the agent's response
 */

export async function sendMessage(
    message: string,
    threadId: string,
    resourceId: string,
): Promise<AxiosResponse<AgentChatResponse>> {
    const body = {
        message: message,
        threadId: threadId,
        resourceId: resourceId,
    };
    const sendMessageResponse = await axios.post(`${BASE_URL}/dojoai/chat`, body);

    return sendMessageResponse;
}

/**
 * gets the chat history for given thread
 * @param threadId the thread id
 * @returns the message history
 */

export async function getChatHistory(
    threadId: string,
): Promise<AxiosResponse<AgentHistoryResponse>> {
    const historyResponse = await axios.get(`${BASE_URL}/dojoai/threadhistory`, {
        params: { threadId: threadId },
    });

    return historyResponse;
}
