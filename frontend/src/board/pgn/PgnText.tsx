import { Move, Pgn, TAGS } from '@jackstenglein/chess';
import {
    Button,
    Card,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import MoveNumber from './MoveNumber';

const Result: React.FC<{ pgn: Pgn }> = ({ pgn }) => {
    const result = pgn.header.tags[TAGS.Result];
    if (!result) {
        return null;
    }

    let title = result;
    let description = '';
    if (result === '1-0') {
        description = 'White Wins';
    } else if (result === '1/2-1/2') {
        title = '½-½';
        description = 'Draw';
    } else if (result === '0-1') {
        description = 'Black Wins';
    }

    return (
        <Stack alignItems='center'>
            <Divider sx={{ width: 1 }} />
            <Typography fontWeight='bold' mt={1}>
                {title}
            </Typography>
            <Typography mb={1} fontStyle='italic'>
                {description}
            </Typography>
        </Stack>
    );
};

interface PgnTextProps {
    pgn: Pgn;
    currentMove: Move | null;
    onClickMove: (m: Move) => void;
}

const PgnText: React.FC<PgnTextProps> = ({ pgn, currentMove, onClickMove }) => {
    const theme = useTheme();

    const renderVariation = (variation: Move[], needReminder = false) => {
        const items = [];

        for (const move of variation) {
            if (move.ply % 2 === 1 || needReminder) {
                items.push(
                    <Grid key={'move-number-' + move.ply} item xs={2}>
                        <MoveNumber ply={move.ply} />
                    </Grid>
                );
                if (move.ply % 2 === 0) {
                    items.push(
                        <Grid key={'ellipsis-' + move.ply} item xs={5}>
                            <Typography color='text.secondary' pl={1}>
                                ...
                            </Typography>
                        </Grid>
                    );
                }
            }
            needReminder = false;

            items.push(
                <Grid key={'move-' + move.ply} item xs={5}>
                    <Button
                        variant={move === currentMove ? 'contained' : 'text'}
                        disableElevation
                        sx={{
                            width: 1,
                            height: 1,
                            textTransform: 'none',
                            justifyContent: 'start',
                            borderRadius: 0,
                            pl: 1,
                            color: theme.palette.text.primary,
                            backgroundColor: move === currentMove ? '#2a4053' : 'initial',
                            fontWeight: move === currentMove ? 'bold' : 'inherit',
                        }}
                        onClick={() => onClickMove(move)}
                    >
                        {move.san}
                    </Button>
                </Grid>
            );

            if (move.commentAfter) {
                if (move.ply % 2 === 1) {
                    items.push(
                        <Grid key={'ellipsis-' + move.ply} item xs={5}>
                            <Typography color='text.secondary' pl={1}>
                                ...
                            </Typography>
                        </Grid>
                    );
                }
                items.push(
                    <Grid key={'comment-' + move.ply} item xs={12}>
                        <Paper elevation={3} sx={{ boxShadow: 'none' }}>
                            <Divider
                                sx={{
                                    position: 'relative',
                                    overflow: 'visible',
                                    backgroundColor: 'inherit',
                                    backgroundImage: 'inherit',

                                    '&:after': {
                                        position: 'absolute',
                                        content: '""',
                                        borderLeft: '1px solid',
                                        borderTop: '1px solid',
                                        borderColor: 'inherit',
                                        borderBottomRightRadius: '14px',
                                        width: '10px',
                                        height: '10px',
                                        zIndex: 1,
                                        top: '-5px',
                                        left: `calc(var(--tools-width) * ${
                                            move.ply % 2 ? '2 / 12' : '7 / 12'
                                        } + 5px)`,
                                        transform: 'rotate(45deg)',
                                        backgroundColor: 'inherit',
                                        backgroundImage: 'inherit',
                                    },
                                }}
                            />
                            <Typography variant='body2' color='text.secondary' p='4px'>
                                {move.commentAfter}
                            </Typography>
                            <Divider />
                        </Paper>
                    </Grid>
                );

                needReminder = true;
            }
        }

        return items;
    };

    const rows = renderVariation(pgn.history.moves);

    return (
        <Card sx={{ overflowY: 'scroll' }}>
            <Grid container>{rows}</Grid>

            <Result pgn={pgn} />
        </Card>
    );
};

export default PgnText;
