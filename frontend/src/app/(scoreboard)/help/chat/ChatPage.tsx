'use client';

import { getChatHistory, sendMessage } from '@/api/chatBotApi';
import { useAuth } from '@/auth/Auth';
import { ChatInput } from '@/components/help/chat/ChatInput';
import { ChatMessage } from '@/components/help/chat/ChatMessage';
import LoadingPage from '@/loading/LoadingPage';
import { Message } from '@jackstenglein/chess-dojo-common/src/chatBot/api';
import { Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import { Filter } from 'bad-words';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const SIGNED_IN_QUESTIONS = [
    'What is DojoAI capable of?',
    'How do I setup Discord?',
    'How do I schedule a sparring session?',
];
const SIGNED_OUT_QUESTIONS = [
    'What is ChessDojo?',
    'How do I get a ChessDojo subscription?',
    'How can the ChessDojo Training Plan help me?',
];

export function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [anonId] = useState(uuidv4());
    const { user } = useAuth();

    let resourceId = '';
    let threadId = '';
    if (!user) {
        resourceId = anonId;
        threadId = `${anonId}-thread`;
    } else {
        resourceId = user.username;
        threadId = `${user.username}-thread`;
    }

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getChatHistory(threadId);
                setMessages(res.data.messages);
            } catch (err) {
                console.error('[ChatPage] Failed to fetch history:', err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        void fetchHistory();
    }, [threadId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    if (isLoadingHistory) {
        return <LoadingPage />;
    }

    const handleSend = async (text: string) => {
        setMessages((prev) => [
            ...prev,
            {
                id: uuidv4(),
                role: 'user',
                content: text,
                createdAt: new Date().toISOString(),
                toolInvocations: [],
            },
        ]);

        if (new Filter().isProfane(text)) {
            setMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    role: 'assistant',
                    content:
                        '[SYSTEM] ⚠️ Please avoid using offensive language. Let’s keep the chat respectful.',
                    createdAt: new Date().toISOString(),
                    toolInvocations: [],
                },
            ]);
            return;
        }

        setIsThinking(true);

        try {
            const res = await sendMessage({ message: text, threadId, resourceId });
            setMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    role: 'assistant',
                    content: res.data.text,
                    createdAt: new Date().toISOString(),
                    toolInvocations: [],
                },
            ]);
        } catch (err) {
            console.error('[ChatPage] Send message failed:', err);
            setMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    role: 'assistant',
                    content:
                        '[SYSTEM] ⚠️ Failed to generate response. Please contact support if this problem persists.',
                    createdAt: new Date().toISOString(),
                    toolInvocations: [],
                },
            ]);
        } finally {
            setIsThinking(false);
        }
    };

    const suggestedQuestions = user ? SIGNED_IN_QUESTIONS : SIGNED_OUT_QUESTIONS;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Container
                maxWidth='md'
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    py: 2,
                }}
            >
                <Typography variant='h4' textAlign='center' mb={2}>
                    DojoAI
                </Typography>
                <Typography
                    variant='body2'
                    color='text.secondary'
                    textAlign='center'
                    sx={{ mb: 4, maxWidth: 'sm', alignSelf: 'center' }}
                >
                    ⚠️ This chat is in beta. DojoAI may be inaccurate and may give responses that do
                    not reflect the Dojo's values. If you notice issues, please contact support.
                    Message history is temporary.
                </Typography>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                    }}
                >
                    {messages.length === 0 && (
                        <Box
                            sx={{
                                p: 3,
                                pb: 0,
                                display: 'flex',
                                gap: 2,
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                            }}
                        >
                            {suggestedQuestions.map((question) => (
                                <Button
                                    key={question}
                                    variant='outlined'
                                    onClick={() => handleSend(question)}
                                    sx={{ borderRadius: 5, px: 3, textTransform: 'none' }}
                                >
                                    {question}
                                </Button>
                            ))}
                        </Box>
                    )}

                    {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))}

                    {isThinking && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 1 }}>
                            <CircularProgress size={16} thickness={5} />
                            <Typography variant='body2' color='text.secondary'>
                                Thinking...
                            </Typography>
                        </Box>
                    )}

                    <div ref={messagesEndRef} />
                </Box>

                <Box sx={{ pt: 1.5, pb: 2 }}>
                    <ChatInput onSend={handleSend} />
                </Box>
            </Container>
        </Box>
    );
}
