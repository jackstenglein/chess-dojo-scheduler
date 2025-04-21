'use client';

import SendIcon from '@mui/icons-material/Send';
import { Box, IconButton, Paper, TextField } from '@mui/material';
import { useState } from 'react';

interface Props {
    onSend: (message: string) => void;
}

export default function ChatInput({ onSend }: Props) {
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput('');
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
                    InputProps={{
                        disableUnderline: true,
                        sx: { px: 1, py: 1 },
                    }}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <IconButton color='primary' onClick={handleSend}>
                    <SendIcon />
                </IconButton>
            </Paper>
        </Box>
    );
}
