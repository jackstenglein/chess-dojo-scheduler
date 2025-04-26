'use client';

import { UIMessage } from '@/api/dojoaiApi';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Box, IconButton, Tooltip } from '@mui/material';
import copy from 'copy-to-clipboard';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DisplayMessage {
    message: UIMessage;
}

export default function ChatMessage({ message }: DisplayMessage) {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        try {
            copy(message.content);
            setCopied(true);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Box
            alignSelf={isUser ? 'flex-end' : 'flex-start'}
            bgcolor={isUser ? '#6D5C3F' : '#343434'}
            color='white'
            px={2}
            py={1.5}
            borderRadius={2}
            maxWidth='80%'
            sx={{ position: 'relative' }}
        >
            {isUser ? (
                message.content
            ) : (
                <>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                        }}
                    >
                        <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                            <IconButton
                                onClick={handleCopy}
                                sx={{ color: 'white', p: 0.2 }}
                                size='small'
                            >
                                {copied ? (
                                    <CheckIcon sx={{ color: 'text.secondary' }} />
                                ) : (
                                    <ContentCopyIcon sx={{ color: 'text.secondary' }} />
                                )}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </>
            )}
        </Box>
    );
}
