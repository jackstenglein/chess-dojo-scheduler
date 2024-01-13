import { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { EventType as ChessEventType, Event } from '@jackstenglein/chess';

import { useApi } from '../../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../../api/Request';
import { Game } from '../../../../database/game';
import { useChess } from '../../PgnBoard';
import { EventType, trackEvent } from '../../../../analytics/events';
import { Box, CircularProgress, Tooltip } from '@mui/material';
import { CloudDone } from '@mui/icons-material';
import { useAuth } from '../../../../auth/Auth';
import { toDojoTimeString } from '../../../../calendar/displayDate';

const useDebounce = (callback: (...args: any) => void, delay: number = 3000) => {
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
    hidden: boolean;
}

const StatusIcon: React.FC<StatusIconProps> = ({ game, hidden }) => {
    const { chess } = useChess();
    const api = useApi();
    const request = useRequest<Date>();
    const [initialPgn, setInitialPgn] = useState(chess?.renderPgn() || '');
    const user = useAuth().user;

    const onSave = (cohort: string, id: string, pgnText: string) => {
        if (pgnText !== initialPgn) {
            request.onStart();
            api.updateGame(cohort, id, {
                type: 'manual',
                pgnText,
                orientation: game.orientation || 'white',
            })
                .then(() => {
                    trackEvent(EventType.UpdateGame, {
                        method: 'manual',
                        dojo_cohort: cohort,
                    });
                    request.onSuccess(new Date());
                    setInitialPgn(pgnText);
                })
                .catch((err) => {
                    console.error('updateGame: ', err);
                    request.onFailure(err);
                });
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
                        debouncedOnSave(game.cohort, game.id, chess.renderPgn());
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, game, setInitialPgn, debouncedOnSave]);

    if (hidden) {
        return (
            <>
                <RequestSnackbar request={request} showSuccess />
            </>
        );
    }

    return (
        <Box
            sx={{
                pr: 1,
                display: 'flex',
                alignItems: 'center',
                position: 'absolute',
                right: 0,
            }}
        >
            {request.isLoading() ? (
                <Tooltip title='Saving'>
                    <CircularProgress size={24} />
                </Tooltip>
            ) : (
                <Tooltip
                    title={
                        request.data
                            ? `Saved at ${toDojoTimeString(
                                  request.data,
                                  user?.timezoneOverride,
                                  user?.timeFormat
                              )}`
                            : `Saved. No changes made since opening.`
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
