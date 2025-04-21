'use client';

import ChatInput from '@/components/aichat/ChatInput';
import ChatMessage, { ChatMessage as Message } from '@/components/aichat/ChatMessage';
import { Box, Button, Container, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string) => {
        const userMessage: Message = {
            id: uuidv4(),
            sender: 'user',
            content: text,
        };
        setMessages((prev) => [...prev, userMessage]);

        const replyId = uuidv4();
        const replyText = `You said: "${text}" 🤖`;

        setMessages((prev) => [...prev, { id: replyId, sender: 'ai', content: '' }]);

        let index = 0;
        const typingInterval = setInterval(() => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === replyId ? { ...msg, content: replyText.slice(0, index + 1) } : msg,
                ),
            );

            index++;

            if (index === replyText.length) {
                clearInterval(typingInterval);
            }
        }, 30);
    };

    const suggestedQuestions = [
        'What is DojoAI capable of?',
        'What is ChessDojo?',
        'How to setup Discord?',
    ];

    return (
        <Box
            sx={{
                height: '100dvh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Container maxWidth='md' sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant='h4' textAlign='center' my={2}>
                    DojoAI
                </Typography>

                <Box
                    flex={1}
                    overflow='auto'
                    display='flex'
                    flexDirection='column'
                    justifyContent={messages.length === 0 ? 'center' : 'flex-start'}
                    alignItems='center'
                    px={2}
                    py={0}
                    gap={2.5}
                >
                    {messages.length === 0 ? (
                        <>
                            <Box
                                sx={{
                                    padding: 3,
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

                            {/* ChatInput closer to center */}
                            <Box mt={4} width='100%'>
                                <ChatInput onSend={handleSend} />
                            </Box>
                        </>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </Box>

                {messages.length > 0 && (
                    <Box sx={{ pb: { xs: 1.5, md: 2 }, px: { xs: 1, md: 2 } }}>
                        <ChatInput onSend={handleSend} />
                    </Box>
                )}
            </Container>
        </Box>
    );
}
