import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import axios from 'axios';
import { Filter } from 'bad-words';
import { errToApiGatewayProxyResultV2, success } from 'chess-dojo-directory-service/api';
import { AgentChatResponse, AGENT_ID, ENDPOINT } from './types';

/**
 * Handles requests to the post a message to agent. 
 * @param event The API gateway event that triggered the request.
 * @returns The agent's message.
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
    try {
        const body = event.body;
        const { message, threadId, resourceId } = JSON.parse(body || '{}');

        if (!message || !threadId || !resourceId) {
            throw new Error('Missing required fields: message, threadId, or resourceId');
        }

        const agentResponse = await sendMessage(message, threadId, resourceId);
        return success(agentResponse);
    } catch (err) {
        return errToApiGatewayProxyResultV2(err);
    }
};

/**
 * Saftey net if bad words make it into backend API, this cleans any bad words so agent does not see any toxic messages
 * @param message the user's message
 * @returns cleaned message
 */
function cleanedMessage(message: string): string {
    const customFilter = new Filter({ placeHolder: '' });

    return customFilter.clean(message);
}

/**
 * send message to agent for given message, threadId, and the resourceID
 * @param message the message content
 * @param threadId the message thread
 * @param resourceId the user's ID the thread and message belong to
 * @returns agent's response 
 */
async function sendMessage(
    message: string,
    threadId: string,
    resourceId: string
): Promise<AgentChatResponse> {
    const AI_ENDPOINT = `${ENDPOINT}/api/agents/${AGENT_ID}/generate`;
    const cleaned = cleanedMessage(message);
    const response = await axios.post(AI_ENDPOINT, {
        messages: [cleaned],
        threadId,
        resourceId,
    });

    return { text: response.data.text };
}
