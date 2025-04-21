'use client';

import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    content: string;
}

interface Props {
    message: ChatMessage;
}

export default function ChatMessage({ message }: Props) {
    const isUser = message.sender === 'user';

    return (
        <Box
            alignSelf={isUser ? 'flex-end' : 'flex-start'}
            bgcolor={isUser ? '#6D5C3F' : '#e0e0e0'}
            color={isUser ? 'white' : 'black'}
            px={2}
            py={1}
            borderRadius={2}
            maxWidth='80%'
            sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'sans-serif',
                code: {
                    fontFamily: 'monospace',
                    background: '#f5f5f5',
                    px: '4px',
                    borderRadius: 1,
                },
                pre: {
                    background: '#f5f5f5',
                    padding: '8px',
                    borderRadius: 2,
                    overflowX: 'auto',
                },
            }}
        >
            {isUser ? (
                message.content
            ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            )}
        </Box>
    );
}
