import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import axios from 'axios';
import { errToApiGatewayProxyResultV2, success } from 'chess-dojo-directory-service/api';
import { AgentHistoryResponse, AGENT_ID, ENDPOINT } from './types';

/**
 * Handles requests to the get message history
 * @param event The API gateway event that triggered the request.
 * @returns The message history
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const threadId = event.queryStringParameters?.threadId;

        if (!threadId) {
            throw new Error('Missing required field: threadId');
        }

        const history = await getChatHistory(threadId);

        return success(history);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Gets the chat history for given thread
 * @param threadId the message threadID
 * @returns list of UIMessages
 */
async function getChatHistory(threadId: string): Promise<AgentHistoryResponse> {
    const AI_HISTORY_ENDPOINT = `${ENDPOINT}/api/memory/threads/${threadId}/messages`;

    const historyResponse = await axios.get(AI_HISTORY_ENDPOINT, {
        params: { agentId: AGENT_ID },
    });

    return { uiMessages: historyResponse.data.uiMessages };
}
