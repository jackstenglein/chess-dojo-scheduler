'use client';

import { getChatHistory, sendMessage, UIMessage } from '@/api/dojoaiApi';
import { useAuth } from '@/auth/Auth';
import ChatInput from '@/components/aichat/ChatInput';
import ChatMessage from '@/components/aichat/ChatMessage';
import LoadingPage from '@/loading/LoadingPage';
import { Box, Button, CircularProgress, Container, Tooltip, Typography } from '@mui/material';
import { Filter } from 'bad-words';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
    const [messages, setMessages] = useState<UIMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const { user } = useAuth();
    let resourceId = '';
    let threadId = '';

    if (!user) {
       const anonId = uuidv4();
       resourceId = anonId;
       threadId = `${anonId}-thread`;
    }else{
        resourceId = user.username;
        threadId = `${user.username}-thread`;
    }


    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getChatHistory(threadId);
                setMessages(res.data.uiMessages);
            } catch (err) {
                console.error('[ChatPage] Failed to fetch history:', err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async (text: string) => {
        const filter = new Filter();

        const userMessage: UIMessage = {
            id: uuidv4(),
            role: 'user',
            content: text,
            createdAt: new Date().toISOString(),
            toolInvocations: [],
        };

        setMessages((prev) => [...prev, userMessage]);

        if (filter.isProfane(text)) {
            const warningMessage: UIMessage = {
                id: uuidv4(),
                role: 'assistant',
                content:
                    '[SYSTEM] ⚠️ Please avoid using offensive language. Let’s keep the chat respectful.',
                createdAt: new Date().toISOString(),
                toolInvocations: [],
            };

            setMessages((prev) => [...prev, warningMessage]);
            return;
        }

        setIsThinking(true);

        try {
            const res = await sendMessage(text, threadId, resourceId);

            const aiReply: UIMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: res.data.text,
                createdAt: new Date().toISOString(),
                toolInvocations: [],
            };

            setMessages((prev) => [...prev, aiReply]);
        } catch (err) {
            console.error('[ChatPage] Send message failed:', err);
        } finally {
            setIsThinking(false);
        }
    };

    const suggestedQuestions = user ? [
        'What is DojoAI capable of?',
        'What is ChessDojo?',
        'How to setup Discord?',
    ] : ['What is ChessDojo?', 'How to get a Chessdojo subscription?', 'How can ChessDojo Training Plan help me?']

    if (isLoadingHistory) {
        return <LoadingPage />;
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'background.default',
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
                <Tooltip title='This chat is in beta. If you notice issues, please contact support.'>
                    <Typography
                        variant='body2'
                        color='text.secondary'
                        textAlign='center'
                        sx={{ cursor: 'help', mb: 2 }}
                    >
                        ⚠️ Chat history is temporary, DojoAI may be inaccurate.
                    </Typography>
                </Tooltip>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2.5,
                        px: 2,
                    }}
                >
                    {messages.length === 0 ? (
                        <Box
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                boxShadow: 1,
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
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <ChatMessage message={msg} />
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
                        </>
                    )}
                </Box>

                <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
                    <ChatInput onSend={handleSend} />
                </Box>
            </Container>
        </Box>
    );
}
