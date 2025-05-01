import {
    ChatRequest,
    ChatResponse,
    GetChatHistoryResponse,
} from '@jackstenglein/chess-dojo-common/src/chatBot/api';
import axios, { AxiosResponse } from 'axios';
import { getConfig } from '../config';

const BASE_URL = getConfig().api.baseUrl;

/**
 * Sends a message to the chat bot.
 * @param request The request to send.
 * @returns An Axios Response containing the bot's response.
 */
export async function sendMessage(request: ChatRequest): Promise<AxiosResponse<ChatResponse>> {
    return await axios.post(`${BASE_URL}/public/dojoai/chat`, request);
}

/**
 * Gets the chat bot history for the given thread.
 * @param threadId The ID of the thread to get.
 * @returns The message history.
 */
export async function getChatHistory(
    threadId: string,
): Promise<AxiosResponse<GetChatHistoryResponse>> {
    return await axios.get(`${BASE_URL}/dojoai/chat`, {
        params: { threadId },
    });
}
