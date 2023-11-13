import copy from 'copy-to-clipboard';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { Move, EventType as ChessEventType, Event } from '@jackstenglein/chess';
import { Stack, Tooltip, IconButton, Paper, Card } from '@mui/material';
import FlipIcon from '@mui/icons-material/WifiProtectedSetup';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import LinkIcon from '@mui/icons-material/Link';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckIcon from '@mui/icons-material/Check';
import SellIcon from '@mui/icons-material/Sell';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExplorerIcon from '@mui/icons-material/Storage';

import DeleteGameButton from '../../games/view/DeleteGameButton';
import { Game } from '../../database/game';
import { useChess } from './PgnBoard';
import { Color } from 'chessground/types';
import PlayerHeader from './PlayerHeader';
import Tags, { TagTextFieldId } from './Tags';
import Editor, { ClockTextFieldId, CommentTextFieldId } from './Editor';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { EventType, trackEvent } from '../../analytics/events';
import { unstable_usePrompt } from 'react-router-dom';
import { GameCommentTextFieldId } from '../../games/view/GamePage';
import { useLightMode } from '../../ThemeProvider';
import Explorer from './Explorer';

interface BoardToolsProps {
    pgn: string;
    showPlayerHeaders: boolean;

    startOrientation?: Color;

    onClickMove: (move: Move | null) => void;

    showSave?: boolean;
    showDelete?: boolean;
    game?: Game;

    showTags?: boolean;
    showEditor?: boolean;
    showExplorer?: boolean;
}

const BoardTools: React.FC<BoardToolsProps> = ({
    pgn,
    showPlayerHeaders,

    startOrientation,
    onClickMove,

    showSave,
    showDelete,
    game,

    showTags,
    showEditor,
    showExplorer,
}) => {
    const { chess, board } = useChess();
    const [copied, setCopied] = useState('');
    const [, setOrientation] = useState<Color>(startOrientation || 'white');
    const [underboard, setUnderboard] = useState(
        showEditor ? 'editor' : showTags ? 'tags' : showExplorer ? 'explorer' : ''
    );
    const request = useRequest();
    const api = useApi();
    const light = useLightMode();

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

    const toggleOrientation = useCallback(() => {
        if (board) {
            board.toggleOrientation();
            setOrientation(board.state.orientation);
        }
    }, [board, setOrientation]);

    useEffect(() => {
        const onArrowKeys = (event: KeyboardEvent) => {
            if (
                event.key === 'f' &&
                document.activeElement?.id !== ClockTextFieldId &&
                document.activeElement?.id !== CommentTextFieldId &&
                document.activeElement?.id !== GameCommentTextFieldId &&
                document.activeElement?.id !== TagTextFieldId
            ) {
                toggleOrientation();
            }
        };
        window.addEventListener('keyup', onArrowKeys);
        return () => {
            window.removeEventListener('keyup', onArrowKeys);
        };
    }, [toggleOrientation]);

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

    const onFirstMove = () => {
        onClickMove(null);
    };

    const onPreviousMove = () => {
        if (chess) {
            onClickMove(chess.previousMove());
        }
    };

    const onNextMove = () => {
        if (chess) {
            const nextMove = chess.nextMove();
            if (nextMove) {
                onClickMove(nextMove);
            }
        }
    };

    const onLastMove = () => {
        if (chess) {
            onClickMove(chess.lastMove());
        }
    };

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

    return (
        <>
            {showPlayerHeaders && (
                <>
                    <PlayerHeader type='header' pgn={chess?.pgn} />
                    <PlayerHeader type='footer' pgn={chess?.pgn} />
                </>
            )}

            <Paper
                elevation={3}
                variant={light ? 'outlined' : 'elevation'}
                sx={{ mt: 1, gridArea: 'boardButtons', boxShadow: 'none' }}
            >
                <Stack direction='row' justifyContent='space-between' flexWrap='wrap'>
                    <Stack direction='row'>
                        <CopyToClipboard
                            text={window.location.href}
                            onCopy={() => onCopy('link')}
                        >
                            <Tooltip title='Copy URL'>
                                <IconButton aria-label='copy-url'>
                                    {copied === 'link' ? (
                                        <CheckIcon sx={{ color: 'text.secondary' }} />
                                    ) : (
                                        <LinkIcon sx={{ color: 'text.secondary' }} />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </CopyToClipboard>

                        <Tooltip title='Copy FEN'>
                            <IconButton aria-label='copy-fen' onClick={onCopyFen}>
                                {copied === 'fen' ? (
                                    <CheckIcon sx={{ color: 'text.secondary' }} />
                                ) : (
                                    <ContentCopyIcon sx={{ color: 'text.secondary' }} />
                                )}
                            </IconButton>
                        </Tooltip>

                        <CopyToClipboard text={pgn} onCopy={() => onCopy('pgn')}>
                            <Tooltip title='Copy PGN'>
                                <IconButton aria-label='copy-pgn'>
                                    {copied === 'pgn' ? (
                                        <CheckIcon sx={{ color: 'text.secondary' }} />
                                    ) : (
                                        <ContentPasteIcon
                                            sx={{ color: 'text.secondary' }}
                                        />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </CopyToClipboard>

                        {showSave && (
                            <Tooltip title='Save PGN'>
                                <IconButton onClick={onSave}>
                                    <SaveIcon
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
                    </Stack>

                    <Stack direction='row'>
                        <Tooltip title='First Move'>
                            <IconButton aria-label='first move' onClick={onFirstMove}>
                                <FirstPageIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Previous Move'>
                            <IconButton
                                aria-label='previous move'
                                onClick={onPreviousMove}
                            >
                                <ChevronLeftIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Next Move'>
                            <IconButton aria-label='next move' onClick={onNextMove}>
                                <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Last Move'>
                            <IconButton aria-label='last move' onClick={onLastMove}>
                                <LastPageIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title='Flip Board'>
                            <IconButton
                                aria-label='flip board'
                                onClick={toggleOrientation}
                            >
                                <FlipIcon sx={{ color: 'text.secondary' }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>

                    <Stack direction='row'>
                        {showTags && setUnderboard && (
                            <Tooltip title='PGN Tags'>
                                <IconButton
                                    aria-label='pgn-tags'
                                    sx={{
                                        color:
                                            underboard === 'tags'
                                                ? 'info.main'
                                                : 'text.secondary',
                                    }}
                                    onClick={() =>
                                        setUnderboard(underboard === 'tags' ? '' : 'tags')
                                    }
                                >
                                    <SellIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {showEditor && setUnderboard && (
                            <Tooltip title='Edit PGN'>
                                <IconButton
                                    aria-label='edit-pgn'
                                    sx={{
                                        color:
                                            underboard === 'editor'
                                                ? 'info.main'
                                                : 'text.secondary',
                                    }}
                                    onClick={() =>
                                        setUnderboard(
                                            underboard === 'editor' ? '' : 'editor'
                                        )
                                    }
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                        )}

                        {showExplorer && setUnderboard && (
                            <Tooltip title='Position Database'>
                                <IconButton
                                    sx={{
                                        color:
                                            underboard === 'explorer'
                                                ? 'info.main'
                                                : 'text.secondary',
                                    }}
                                    onClick={() =>
                                        setUnderboard(
                                            underboard === 'explorer' ? '' : 'explorer'
                                        )
                                    }
                                >
                                    <ExplorerIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>
            </Paper>

            {underboard && (
                <Card
                    elevation={3}
                    sx={{
                        gridArea: 'underboard',
                        overflowY: 'scroll',
                        boxShadow: 'none',
                        maxHeight: { xs: '22em', xl: 1 },
                        mt: { xs: 2, xl: 0 },
                    }}
                    variant={light ? 'outlined' : 'elevation'}
                >
                    {underboard === 'tags' && (
                        <Tags
                            tags={chess?.pgn.header.tags}
                            game={game}
                            allowEdits={showEditor}
                        />
                    )}
                    {underboard === 'editor' && <Editor />}
                    {underboard === 'explorer' && <Explorer />}
                </Card>
            )}

            <RequestSnackbar request={request} showSuccess />
        </>
    );
};

export default BoardTools;
