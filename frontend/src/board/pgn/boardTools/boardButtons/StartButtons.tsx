import { useEffect, useState } from 'react';
import copy from 'copy-to-clipboard';
import CopyToClipboard from 'react-copy-to-clipboard';
import { EventType as ChessEventType } from '@jackstenglein/chess';
import { Stack, Tooltip, IconButton } from '@mui/material';
import { Check, ContentCopy, ContentPaste, Link } from '@mui/icons-material';

import { useChess } from '../../PgnBoard';

const StartButtons = () => {
    const { chess } = useChess();
    const [copied, setCopied] = useState('');

    const [editorPgn, setEditorPgn] = useState(chess?.renderPgn() || '');
    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    ChessEventType.NewVariation,
                    ChessEventType.UpdateComment,
                    ChessEventType.UpdateCommand,
                    ChessEventType.UpdateNags,
                    ChessEventType.Initialized,
                    ChessEventType.UpdateDrawables,
                    ChessEventType.DeleteMove,
                    ChessEventType.PromoteVariation,
                    ChessEventType.UpdateHeader,
                ],
                handler: () => {
                    setEditorPgn(chess.renderPgn());
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setEditorPgn]);

    const onCopy = (name: string) => {
        setCopied(name);
        setTimeout(() => {
            setCopied('');
        }, 2500);
    };

    const onCopyFen = () => {
        copy(chess?.fen() || '');
        onCopy('fen');
    };

    return (
        <Stack direction='row' sx={{ position: 'absolute', left: 0 }}>
            <CopyToClipboard text={window.location.href} onCopy={() => onCopy('link')}>
                <Tooltip title='Copy URL'>
                    <IconButton aria-label='copy-url'>
                        {copied === 'link' ? (
                            <Check sx={{ color: 'text.secondary' }} />
                        ) : (
                            <Link sx={{ color: 'text.secondary' }} />
                        )}
                    </IconButton>
                </Tooltip>
            </CopyToClipboard>

            <Tooltip title='Copy FEN'>
                <IconButton aria-label='copy-fen' onClick={onCopyFen}>
                    {copied === 'fen' ? (
                        <Check sx={{ color: 'text.secondary' }} />
                    ) : (
                        <ContentCopy sx={{ color: 'text.secondary' }} />
                    )}
                </IconButton>
            </Tooltip>

            <CopyToClipboard text={editorPgn} onCopy={() => onCopy('pgn')}>
                <Tooltip title='Copy PGN'>
                    <IconButton aria-label='copy-pgn'>
                        {copied === 'pgn' ? (
                            <Check sx={{ color: 'text.secondary' }} />
                        ) : (
                            <ContentPaste sx={{ color: 'text.secondary' }} />
                        )}
                    </IconButton>
                </Tooltip>
            </CopyToClipboard>
        </Stack>
    );
};

export default StartButtons;
