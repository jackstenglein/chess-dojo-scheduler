import {
    ChatRequest,
    ChatResponse,
    GetChatHistoryResponse,
} from '@jackstenglein/chess-dojo-common/src/chatBot/api';
import { AxiosResponse } from 'axios';
import { axiosService } from './axiosService';

/**
 * Sends a message to the chat bot.
 * @param request The request to send.
 * @returns An Axios Response containing the bot's response.
 */
export async function sendMessage(request: ChatRequest): Promise<AxiosResponse<ChatResponse>> {
    return await axiosService.post(`/public/dojoai/chat`, request, {
        functionName: 'sendMessage',
    });
}

/**
 * Gets the chat bot history for the given thread.
 * @param threadId The ID of the thread to get.
 * @returns The message history.
 */
export async function getChatHistory(
    threadId: string,
): Promise<AxiosResponse<GetChatHistoryResponse>> {
    return await axiosService.get(`/public/dojoai/chat`, {
        params: { threadId },
        functionName: 'getChatHistory',
    });
}
