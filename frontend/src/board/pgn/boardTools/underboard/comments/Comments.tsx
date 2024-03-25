import { Chess, EventType, Move } from '@jackstenglein/chess';
import {
    Button,
    CardContent,
    Divider,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Game, PositionComment } from '../../../../../database/game';
import { reconcile } from '../../../../Board';
import { useChess } from '../../../PgnBoard';
import Comment from './Comment';
import CommentEditor from './CommentEditor';

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

    const fenSections = getFenSections(game, chess, view, sortBy);

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

function getFenSections(game: Game, chess: Chess, view: View, sort: SortBy) {
    if (!game.positionComments || Object.values(game.positionComments).length === 0) {
        return [];
    }

    const fenSections: PositionCommentSection[] = [];

    if (view === View.CurrentMove) {
        const comments = getCommentsForFen(
            game,
            chess.normalizedFen(),
            chess.currentMove(),
            sort,
        );
        fenSections.push({ move: chess.currentMove(), comments });
        return fenSections;
    }

    const startingComments = getCommentsForFen(game, chess.setUpFen(), null, sort);
    if (startingComments.length > 0) {
        fenSections.push({ move: null, comments: startingComments });
    }

    const stack = [chess.history()[0]];
    let move: Move | undefined;
    while ((move = stack.pop()) !== undefined) {
        const fen = chess.normalizedFen(move);
        const selectedComments = getCommentsForFen(game, fen, move, sort);
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
    sort: SortBy,
): PositionComment[] {
    const fenComments = game.positionComments[fen] || {};
    const selectedComments: PositionComment[] = [];

    for (const comment of Object.values(fenComments)) {
        if (comment.ply === (move?.ply || 0) && comment.san === move?.san) {
            selectedComments.push(comment);
        }
    }

    selectedComments.sort((lhs, rhs) => {
        if (sort === SortBy.Newest) {
            return rhs.createdAt.localeCompare(lhs.createdAt);
        }
        return lhs.createdAt.localeCompare(rhs.createdAt);
    });

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
