import React, { useCallback, useEffect, useState } from 'react';
import { unstable_usePrompt } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import CopyToClipboard from 'react-copy-to-clipboard';
import { EventType as ChessEventType, Event } from '@jackstenglein/chess';
import { Stack, Tooltip, IconButton } from '@mui/material';
import { Check, ContentCopy, ContentPaste, Link, Save } from '@mui/icons-material';

import DeleteGameButton from '../../../../games/view/DeleteGameButton';
import { useChess } from '../../PgnBoard';
import { Game } from '../../../../database/game';
import { useApi } from '../../../../api/Api';
import { EventType, trackEvent } from '../../../../analytics/events';
import { RequestSnackbar, useRequest } from '../../../../api/Request';

interface StartButtonsProps {
    showSave?: boolean;
    showDelete?: boolean;
    game?: Game;
}

const StartButtons: React.FC<StartButtonsProps> = ({ showSave, showDelete, game }) => {
    const { chess } = useChess();
    const [copied, setCopied] = useState('');
    const api = useApi();
    const request = useRequest();

    const [initialPgn, setInitialPgn] = useState(chess?.renderPgn() || '');
    const [editorPgn, setEditorPgn] = useState(initialPgn);
    unstable_usePrompt({
        when: !!showSave && initialPgn !== editorPgn,
        message:
            'Your PGN has unsaved changes that will be lost. Are you sure you want to leave?',
    });

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
                handler: (event: Event) => {
                    if (event.type === ChessEventType.Initialized) {
                        const pgn = chess.renderPgn();
                        setInitialPgn(pgn);
                        setEditorPgn(pgn);
                    } else {
                        setEditorPgn(chess.renderPgn());
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setEditorPgn]);

    const onSave = useCallback(() => {
        if (!game || !chess) {
            return;
        }

        request.onStart();
        api.updateGame(game.cohort, game.id, {
            type: 'manual',
            pgnText: chess.renderPgn(),
            orientation: game.orientation || 'white',
        })
            .then(() => {
                trackEvent(EventType.UpdateGame, {
                    method: 'manual',
                    dojo_cohort: game.cohort,
                });
                request.onSuccess('Game updated');
                setInitialPgn(editorPgn);
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
    }, [chess, api, game, request, editorPgn]);

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

            {showSave && (
                <Tooltip title='Save PGN'>
                    <IconButton onClick={onSave}>
                        <Save
                            sx={{
                                color:
                                    editorPgn === initialPgn
                                        ? 'text.secondary'
                                        : 'warning.main',
                            }}
                        />
                    </IconButton>
                </Tooltip>
            )}

            {showDelete && game && <DeleteGameButton game={game} />}

            <RequestSnackbar request={request} showSuccess />
        </Stack>
    );
};

export default StartButtons;
