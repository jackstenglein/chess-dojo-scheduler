import React, { useState } from 'react';
import copy from 'copy-to-clipboard';
import { Stack, Tooltip, IconButton, Menu, MenuItem } from '@mui/material';
import { Check, ContentPaste } from '@mui/icons-material';

import { useChess } from '../../PgnBoard';

const StartButtons = () => {
    const { chess } = useChess();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [copied, setCopied] = useState('');

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const onCopy = (name: string) => {
        setCopied(name);
        handleClose();
        setTimeout(() => {
            setCopied('');
        }, 2500);
    };

    const onCopyUrl = () => {
        copy(window.location.href);
        onCopy('url');
    };

    const onCopyFen = () => {
        copy(chess?.fen() || '');
        onCopy('fen');
    };

    const onCopyPGN = () => {
        copy(chess?.renderPgn() || '');
        onCopy('pgn');
    };

    return (
        <Stack direction='row'>
            <Tooltip title='Copy'>
                <IconButton onClick={handleClick}>
                    {copied ? (
                        <Check sx={{ color: 'text.secondary' }} />
                    ) : (
                        <ContentPaste sx={{ color: 'text.secondary' }} />
                    )}
                </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItem onClick={onCopyUrl}>Copy URL</MenuItem>
                <MenuItem onClick={onCopyFen}>Copy FEN</MenuItem>
                <MenuItem onClick={onCopyPGN}>Copy PGN</MenuItem>
            </Menu>
        </Stack>
    );
};

export default StartButtons;
