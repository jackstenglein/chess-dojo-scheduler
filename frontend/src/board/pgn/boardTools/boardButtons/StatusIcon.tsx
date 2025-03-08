/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { useReconcile } from '@/board/Board';
import { toDojoDateString, toDojoTimeString } from '@/components/calendar/displayDate';
import { Game } from '@/database/game';
import { EventType as ChessEventType, Event } from '@jackstenglein/chess';
import { GameImportTypes } from '@jackstenglein/chess-dojo-common/src/database/game';
import { CloudDone, CloudOff } from '@mui/icons-material';
import { Box, CircularProgress, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChess } from '../../PgnBoard';

export function useDebounce(callback: (...args: any[]) => void, delay = 6000) {
    const ref = useRef<(...args: any[]) => void>();

    useEffect(() => {
        ref.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        const func = (...args: any[]) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            ref.current?.(...args);
        };

        return debounce(func, delay);
    }, [delay]);

    return debouncedCallback;
}

interface UndoLog {
    date: Date;
    pgn: string;
}

interface StatusIconProps {
    game: Game;
}

const StatusIcon: React.FC<StatusIconProps> = ({ game }) => {
    const { chess } = useChess();
    const api = useApi();
    const request = useRequest<Date>();
    const [initialPgn, setInitialPgn] = useState(chess?.renderPgn() || '');
    const [hasChanges, setHasChanges] = useState(false);
    const [undoLog, setUndoLog] = useState<UndoLog[]>([]);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const { user } = useAuth();
    const reconcile = useReconcile();

    const onSave = (cohort: string, id: string, pgnText: string, isUndo?: boolean) => {
        if (pgnText !== initialPgn) {
            request.onStart();
            api.updateGame(cohort, id, {
                type: GameImportTypes.editor,
                pgnText,
            })
                .then(() => {
                    trackEvent(EventType.UpdateGame, {
                        method: 'autosave',
                        dojo_cohort: cohort,
                    });

                    if (!isUndo) {
                        setUndoLog((log) => [
                            ...log,
                            {
                                date: request.data || new Date(game.updatedAt || ''),
                                pgn: initialPgn,
                            },
                        ]);
                    }

                    const date = new Date();
                    request.onSuccess(date);
                    setInitialPgn(pgnText);
                    setHasChanges(false);
                })
                .catch((err) => {
                    console.error('updateGame: ', err);
                    request.onFailure(err);
                });
        } else {
            setHasChanges(false);
        }
    };

    const debouncedOnSave = useDebounce(onSave);

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
                    ChessEventType.DeleteBeforeMove,
                    ChessEventType.PromoteVariation,
                    ChessEventType.UpdateHeader,
                ],
                handler: (event: Event) => {
                    if (event.type === ChessEventType.Initialized) {
                        const pgn = chess.renderPgn();
                        setInitialPgn(pgn);
                    } else {
                        const pgn = chess.renderPgn();
                        setHasChanges(pgn !== initialPgn);
                        debouncedOnSave(game.cohort, game.id, pgn);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, game, initialPgn, setInitialPgn, debouncedOnSave, setHasChanges]);

    const onRestore = () => {
        setAnchorEl(null);
        const undo = undoLog[undoLog.length - 1];
        if (!undo?.pgn) {
            return;
        }

        onSave(game.cohort, game.id, undo.pgn, true);
        setUndoLog(undoLog.slice(0, -1));

        let currentMove = chess?.currentMove();
        chess?.loadPgn(undo.pgn);
        chess?.seek(null, true);

        const moves = [];
        while (currentMove) {
            moves.push(currentMove);
            currentMove = currentMove.previous;
        }

        for (let i = moves.length - 1; i >= 0; i--) {
            if (!chess?.move(moves[i].san, { existingOnly: true })) {
                break;
            }
        }
        reconcile();
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
            }}
        >
            {request.isLoading() ? (
                <Tooltip title='Saving'>
                    <CircularProgress size={24} sx={{ mx: 1 }} />
                </Tooltip>
            ) : request.isFailure() ? (
                <Tooltip title='Failed to save. Click to retry.'>
                    <IconButton
                        onClick={() => chess && onSave(game.cohort, game.id, chess.renderPgn())}
                    >
                        <CloudOff color='error' />
                    </IconButton>
                </Tooltip>
            ) : hasChanges ? (
                <Tooltip title='Unsaved changes.'>
                    <CloudOff sx={{ color: 'text.secondary', mx: 1 }} />
                </Tooltip>
            ) : (
                <Tooltip
                    title={
                        request.data || game.updatedAt
                            ? `Last saved at ${toDojoDateString(
                                  request.data || new Date(game.updatedAt || ''),
                                  user?.timezoneOverride,
                              )} ${toDojoTimeString(
                                  request.data || new Date(game.updatedAt || ''),
                                  user?.timezoneOverride,
                                  user?.timeFormat,
                              )}. ${undoLog.length ? 'Click to restore previous version.' : 'No changes made since opening.'}`
                            : `No changes made since opening.`
                    }
                >
                    <IconButton
                        onClick={undoLog.length ? (e) => setAnchorEl(e.currentTarget) : undefined}
                    >
                        <CloudDone sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>
            )}

            {anchorEl && (
                <Menu anchorEl={anchorEl} open onClose={() => setAnchorEl(null)}>
                    {undoLog.length ? (
                        <MenuItem onClick={onRestore}>
                            Restore Previous Save (
                            {toDojoDateString(
                                undoLog[undoLog.length - 1].date,
                                user?.timezoneOverride,
                            )}{' '}
                            {toDojoTimeString(
                                undoLog[undoLog.length - 1].date,
                                user?.timezoneOverride,
                                user?.timeFormat,
                            )}
                            )
                        </MenuItem>
                    ) : (
                        <MenuItem onClick={() => setAnchorEl(null)}>No Previous Versions</MenuItem>
                    )}
                </Menu>
            )}

            <RequestSnackbar request={request} />
        </Box>
    );
};

export default StatusIcon;
