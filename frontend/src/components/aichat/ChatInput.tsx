'use client';

import SupportTicket from '@/app/(scoreboard)/help/SupportTicket';
import SendIcon from '@mui/icons-material/Send';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { Box, IconButton, Modal, Paper, TextField } from '@mui/material';
import { useState } from 'react';

interface ChatInput {
    onSend: (message: string) => void;
}

export default function ChatInput({ onSend }: ChatInput) {
    const [input, setInput] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput('');
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <Box
            py={2}
            px={1}
            display='flex'
            justifyContent='center'
            sx={{ position: 'sticky', bottom: 0 }}
        >
            <Paper
                elevation={3}
                component='form'
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: 700,
                    borderRadius: 10,
                    px: 2,
                    py: 0.5,
                }}
            >
                <TextField
                    variant='standard'
                    fullWidth
                    placeholder='Type a message...'
                    slotProps={{
                        input: {
                            disableUnderline: true,
                            sx: { px: 1, py: 1 },
                        },
                    }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <IconButton sx={{ color: '#906721' }} onClick={handleSend} title='Send Message'>
                    <SendIcon />
                </IconButton>
                <IconButton
                    sx={{ color: '#906721' }}
                    onClick={handleOpenModal}
                    title='Open Support Ticket'
                >
                    <SupportAgentIcon />
                </IconButton>
            </Paper>

            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                aria-labelledby='support-ticket-modal'
                aria-describedby='support-ticket-form'
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                        width: '90%',
                        maxWidth: 500,
                    }}
                >
                    <SupportTicket />
                </Box>
            </Modal>
        </Box>
    );
}
