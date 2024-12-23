import { Check, ContentPaste } from '@mui/icons-material';
import { IconButton, Menu, MenuItem, Stack, Tooltip } from '@mui/material';
import copy from 'copy-to-clipboard';
import React, { useEffect, useState } from 'react';

import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import { useRouter } from '@/hooks/useRouter';
import { EventType as ChessEventType } from '@jackstenglein/chess';
import { usePathname } from 'next/navigation';
import { useChess } from '../../PgnBoard';

const StartButtons = () => {
    const { chess } = useChess();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [copied, setCopied] = useState('');
    const { searchParams } = useNextSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    useEffect(() => {
        if (!chess) {
            return;
        }

        const observer = {
            types: [
                ChessEventType.NewVariation,
                ChessEventType.UpdateComment,
                ChessEventType.UpdateCommand,
                ChessEventType.UpdateNags,
                ChessEventType.Initialized,
                ChessEventType.UpdateDrawables,
                ChessEventType.DeleteMove,
                ChessEventType.DeleteBeforeMove,
                ChessEventType.PromoteVariation,
                ChessEventType.UpdateHeader,
                ChessEventType.LegalMove,
            ],
            handler: () => {
                const fen = chess.currentMove()?.fen;
                if (!fen) {
                    return;
                }

                const params = new URLSearchParams(searchParams);
                params.set('fen', fen);

                const url = `${pathname}?${params.toString()}`;
                window.history.replaceState(
                    { ...window.history.state, as: url, url },
                    '',
                    url,
                );
            },
        };

        chess.addObserver(observer);

        return () => chess.removeObserver(observer);
    }, [chess, pathname, router, searchParams]);

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
