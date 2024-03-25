import { Chess, EventType, Move } from '@jackstenglein/chess';
import { Send } from '@mui/icons-material';
import {
    Button,
    CardContent,
    CircularProgress,
    Divider,
    IconButton,
    Link,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useApi } from '../../../../api/Api';
import { RequestSnackbar, useRequest } from '../../../../api/Request';
import { useAuth } from '../../../../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../../../../calendar/displayDate';
import { Game, PositionComment } from '../../../../database/game';
import Avatar from '../../../../profile/Avatar';
import GraduationIcon from '../../../../scoreboard/GraduationIcon';
import { reconcile } from '../../../Board';
import { BlockBoardKeyboardShortcuts, useChess } from '../../PgnBoard';

enum View {
    FullGame = 'FULL_GAME',
    CurrentMove = 'CURRENT_MOVE',
}

enum SortBy {
    Newest = 'NEWEST',
    Oldest = 'OLDEST',
}

interface PositionCommentSection {
    move: Move | null;
    comments: PositionComment[];
}

interface CommentsProps {
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

const Comments: React.FC<CommentsProps> = ({ game, onSaveGame }) => {
    const [view, setView] = useState(View.FullGame);
    const [sortBy, setSortBy] = useState(SortBy.Newest);
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.DeleteMove,
                    EventType.PromoteVariation,
                ],
                handler: () => {
                    setForceRender((v) => v + 1);
                },
            };
            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    if (!game || !onSaveGame || !chess) {
        return null;
    }

    const fenSections = getFenSections(game, chess, view);

    return (
        <CardContent sx={{ height: 1, p: 0 }}>
            <Stack height={1}>
                <Stack flexGrow={1} sx={{ overflowY: 'auto', p: 2 }}>
                    <Stack direction='row' spacing={1}>
                        <TextField
                            label='Show Comments From'
                            select
                            value={view}
                            onChange={(e) => setView(e.target.value as View)}
                            fullWidth
                            size='small'
                        >
                            <MenuItem value={View.FullGame}>Entire Game</MenuItem>
                            <MenuItem value={View.CurrentMove}>
                                Current Position Only
                            </MenuItem>
                        </TextField>

                        <TextField
                            label='Sort By'
                            select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            fullWidth
                            size='small'
                        >
                            <MenuItem value={SortBy.Newest}>Newest First</MenuItem>
                            <MenuItem value={SortBy.Oldest}>Oldest First</MenuItem>
                        </TextField>
                    </Stack>

                    <Stack spacing={4} mt={3} flexGrow={1}>
                        {fenSections.map((s) => (
                            <CommentSection key={s.move?.fen || 'start'} section={s} />
                        ))}
                    </Stack>
                </Stack>

                <CommentEditor game={game} onSuccess={onSaveGame} />
            </Stack>
        </CardContent>
    );
};

export default Comments;

function getFenSections(game: Game, chess: Chess, view: View) {
    if (!game.positionComments || Object.values(game.positionComments).length === 0) {
        return [];
    }

    const fenSections: PositionCommentSection[] = [];

    if (view === View.CurrentMove) {
        const comments = getCommentsForFen(
            game,
            chess.normalizedFen(),
            chess.currentMove(),
        );
        fenSections.push({ move: chess.currentMove(), comments });
        return fenSections;
    }

    const startingComments = getCommentsForFen(game, chess.setUpFen(), null);
    if (startingComments.length > 0) {
        fenSections.push({ move: null, comments: startingComments });
    }

    const stack = [chess.history()[0]];
    let move: Move | undefined;
    while ((move = stack.pop()) !== undefined) {
        const fen = chess.normalizedFen(move);

        const fenComments = game.positionComments[fen] || {};
        const selectedComments: PositionComment[] = [];

        for (const comment of Object.values(fenComments)) {
            if (comment.ply === move.ply && comment.san === move.san) {
                selectedComments.push(comment);
            }
        }

        if (selectedComments.length > 0) {
            fenSections.push({ move, comments: selectedComments });
        }

        if (move.next) {
            stack.push(move.next);
        }
        for (let i = move.variations.length - 1; i >= 0; i--) {
            stack.push(move.variations[i][0]);
        }
    }

    return fenSections;
}

function getCommentsForFen(
    game: Game,
    fen: string,
    move: Move | null,
): PositionComment[] {
    const fenComments = game.positionComments[fen] || {};
    const selectedComments: PositionComment[] = [];

    for (const comment of Object.values(fenComments)) {
        if (comment.ply === (move?.ply || 0) && comment.san === move?.san) {
            selectedComments.push(comment);
        }
    }

    return selectedComments;
}

interface CommentSectionProps {
    section: PositionCommentSection;
}

const CommentSection: React.FC<CommentSectionProps> = ({ section }) => {
    const { chess, board } = useChess();
    const move = section.move;

    const onClick = () => {
        chess?.seek(section.move);
        reconcile(chess, board);
    };

    return (
        <Stack width={1} spacing={3}>
            <Stack width={1} alignItems='start'>
                <Button sx={{ textTransform: 'none', pb: 0 }} onClick={onClick}>
                    {move
                        ? `${move.ply % 2 ? `${Math.floor(move.ply / 2) + 1}.` : `${move.ply / 2}...`} ${move.san}`
                        : 'Starting Position'}
                </Button>
                <Divider sx={{ width: 1 }} />
            </Stack>
            {section.comments.map((c) => (
                <Comment key={c.id} comment={c} />
            ))}
            {section.comments.length === 0 && <Typography>No comments</Typography>}
        </Stack>
    );
};

interface CommentProps {
    comment: PositionComment;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
    const viewer = useAuth().user;
    const createdAt = new Date(comment.createdAt);

    const createdAtDate = toDojoDateString(createdAt, viewer?.timezoneOverride);
    const createdAtTime = toDojoTimeString(
        createdAt,
        viewer?.timezoneOverride,
        viewer?.timeFormat,
    );

    return (
        <Stack spacing={0.5}>
            <Stack direction='row' spacing={1.5}>
                <Avatar
                    username={comment.owner.username}
                    displayName={comment.owner.displayName}
                    size={48}
                />
                <Stack>
                    <Stack direction='row' spacing={1} alignItems='center'>
                        <Link
                            component={RouterLink}
                            to={`/profile/${comment.owner.username}`}
                        >
                            <Typography variant='subtitle1' color='text.secondary'>
                                {comment.owner.displayName} ({comment.owner.cohort})
                            </Typography>
                        </Link>
                        <GraduationIcon cohort={comment.owner.previousCohort} size={20} />
                    </Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        {createdAtDate} • {createdAtTime}
                    </Typography>
                </Stack>
            </Stack>
            <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                {comment.content}
            </Typography>
        </Stack>
    );
};

interface CommentEditorProps {
    game: Game;
    onSuccess: (game: Game) => void;
}

const CommentEditor: React.FC<CommentEditorProps> = ({ game, onSuccess }) => {
    const user = useAuth().user!;
    const api = useApi();
    const [comment, setComment] = useState('');
    const request = useRequest();
    const { chess } = useChess();

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
        };
        const existingComments = Boolean(game.positionComments?.[positionComment.fen]);

        request.onStart();
        api.createComment(game.cohort, game.id, positionComment, existingComments)
            .then((resp) => {
                console.log('createComment: ', resp);
                setComment('');
                request.onSuccess();
                onSuccess(resp.data);
            })
            .catch((err) => {
                console.error('createComment: ', err);
                request.onFailure(err);
            });
    };

    const move = chess?.currentMove();

    return (
        <Stack spacing={1} direction='row' alignItems='end' px={2}>
            <TextField
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
                disabled={request.isLoading()}
                maxRows={8}
            />
            {request.isLoading() ? (
                <CircularProgress size={40} />
            ) : (
                <Tooltip title='Post Comment'>
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
