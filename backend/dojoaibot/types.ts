export const AGENT_ID = process.env.agent;
export const ENDPOINT = process.env.endpoint;

export interface AgentHistoryResponse {
    uiMessages: UIMessage[];
}

export interface AgentChatResponse {
    text: string;
}

export interface UIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    toolInvocations: any[];
}
