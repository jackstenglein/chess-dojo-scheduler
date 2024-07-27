import { useGame } from '@/games/view/GameContext';
import { Send } from '@mui/icons-material';
import { CircularProgress, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useApi } from '../../../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../../../api/Request';
import { useRequiredAuth } from '../../../../../auth/Auth';
import { PositionComment } from '../../../../../database/game';
import { BlockBoardKeyboardShortcuts, useChess } from '../../../PgnBoard';

export interface CommentEditorProps {
    focusEditor: boolean;
    setFocusEditor: (v: boolean) => void;
}

const CommentEditor: React.FC<CommentEditorProps> = ({ focusEditor, setFocusEditor }) => {
    const { user } = useRequiredAuth();
    const api = useApi();
    const [comment, setComment] = useState('');
    const request = useRequest();
    const { chess } = useChess();
    const { game, onUpdateGame } = useGame();
    const textFieldRef = useRef<HTMLTextAreaElement>();

    useEffect(() => {
        if (focusEditor && textFieldRef.current) {
            textFieldRef.current.focus();
            textFieldRef.current.selectionStart = textFieldRef.current.value.length;
            textFieldRef.current.selectionEnd = textFieldRef.current.selectionStart;
            setFocusEditor(false);
        }
    }, [focusEditor, setFocusEditor]);

    if (!game || !onUpdateGame) {
        return null;
    }

    const onSubmit = () => {
        const content = comment.trim();
        if (content.length === 0) {
            return;
        }

        const positionComment: PositionComment = {
            id: '',
            fen: chess?.normalizedFen() || '',
            ply: chess?.currentMove()?.ply || 0,
            san: chess?.currentMove()?.san,
            owner: {
                username: user.username,
                displayName: user.displayName,
                cohort: user.dojoCohort,
                previousCohort: user.previousCohort,
            },
            createdAt: '',
            updatedAt: '',
            content,
            parentIds: '',
            replies: {},
        };
        const existingComments = Boolean(game.positionComments[positionComment.fen]);

        request.onStart();
        api.createComment(game.cohort, game.id, positionComment, existingComments)
            .then((resp) => {
                console.log('createComment: ', resp);
                setComment('');
                request.onSuccess();
                onUpdateGame(resp.data);
            })
            .catch((err) => {
                console.error('createComment: ', err);
                request.onFailure(err);
            });
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'Enter' || !e.shiftKey) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        onSubmit();
    };

    const move = chess?.currentMove();

    return (
        <Stack spacing={1} direction='row' alignItems='end' px={2}>
            <TextField
                inputRef={textFieldRef}
                id={BlockBoardKeyboardShortcuts}
                placeholder={`Comment on ${
                    move
                        ? `${move.ply % 2 ? `${Math.floor(move.ply / 2) + 1}.` : `${move.ply / 2}...`} ${move.san}`
                        : 'Starting Position'
                }`}
                fullWidth
                multiline
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={request.isLoading()}
                maxRows={8}
            />
            {request.isLoading() ? (
                <CircularProgress size={40} />
            ) : (
                <Tooltip title='Post Comment. Tip: you can also use shift+enter while typing.'>
                    <div>
                        <IconButton
                            disabled={comment.trim().length === 0}
                            color='primary'
                            onClick={onSubmit}
                        >
                            <Send />
                        </IconButton>
                    </div>
                </Tooltip>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

export default CommentEditor;
