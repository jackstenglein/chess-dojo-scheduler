import { EventType as ChessEventType, Event } from '@jackstenglein/chess';
import { CloudDone, CloudOff } from '@mui/icons-material';
import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EventType, trackEvent } from '../../../../analytics/events';
import { useApi } from '../../../../api/Api';
import { GameSubmissionType } from '../../../../api/gameApi';
import { RequestSnackbar, useRequest } from '../../../../api/Request';
import { useAuth } from '../../../../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../../../../calendar/displayDate';
import { Game } from '../../../../database/game';
import { useChess } from '../../PgnBoard';

export const useDebounce = (callback: (...args: any) => void, delay: number = 6000) => {
    const ref = useRef<any>();

    useEffect(() => {
        ref.current = callback;
    }, [callback]);

    const debouncedCallback = useMemo(() => {
        const func = (...args: any) => {
            ref.current?.(...args);
        };

        return debounce(func, delay);
    }, [delay]);

    return debouncedCallback;
};

interface StatusIconProps {
    game: Game;
}

const StatusIcon: React.FC<StatusIconProps> = ({ game }) => {
    const { chess } = useChess();
    const api = useApi();
    const request = useRequest<Date>();
    const [initialPgn, setInitialPgn] = useState(chess?.renderPgn() || '');
    const [hasChanges, setHasChanges] = useState(false);
    const user = useAuth().user;

    const onSave = (cohort: string, id: string, pgnText: string) => {
        if (pgnText !== initialPgn) {
            request.onStart();
            api.updateGame(cohort, id, {
                type: GameSubmissionType.Manual,
                pgnText,
                unlisted: game.unlisted ?? true,
            })
                .then(() => {
                    trackEvent(EventType.UpdateGame, {
                        method: 'autosave',
                        dojo_cohort: cohort,
                    });
                    request.onSuccess(new Date());
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

    return (
        <Box
            sx={{
                pr: request.isFailure() ? undefined : 1,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            {request.isLoading() ? (
                <Tooltip title='Saving'>
                    <CircularProgress size={24} />
                </Tooltip>
            ) : request.isFailure() ? (
                <Tooltip title='Failed to save. Click to retry.'>
                    <IconButton
                        onClick={() =>
                            chess && onSave(game.cohort, game.id, chess.renderPgn())
                        }
                    >
                        <CloudOff color='error' />
                    </IconButton>
                </Tooltip>
            ) : hasChanges ? (
                <Tooltip title='Unsaved changes.'>
                    <CloudOff sx={{ color: 'text.secondary' }} />
                </Tooltip>
            ) : (
                <Tooltip
                    title={
                        request.data || game.updatedAt
                            ? `Last saved at ${toDojoDateString(
                                  request.data || new Date(game.updatedAt!),
                                  user?.timezoneOverride,
                              )} ${toDojoTimeString(
                                  request.data || new Date(game.updatedAt!),
                                  user?.timezoneOverride,
                                  user?.timeFormat,
                              )}`
                            : `No changes made since opening.`
                    }
                >
                    <CloudDone sx={{ color: 'text.secondary' }} />
                </Tooltip>
            )}

            <RequestSnackbar request={request} />
        </Box>
    );
};

export default StatusIcon;
