import { Move } from '@jackstenglein/chess';
import { Divider, Grid, Paper } from '@mui/material';
import Comment from './Comment';
import Ellipsis from './Ellipsis';
import Lines from './Lines';

export function hasInterrupt(move: Move): boolean {
    return (
        (move.commentAfter?.trim().length || 0) > 0 ||
        move.variations?.some((v) => v.length > 0)
    );
}

interface InterruptProps {
    move: Move;
    handleScroll: (child: HTMLElement | null) => void;
}

const Interrupt: React.FC<InterruptProps> = ({ move, handleScroll }) => {
    if (!hasInterrupt(move)) {
        return null;
    }

    return (
        <>
            {move.ply % 2 === 1 && <Ellipsis ply={move.ply} />}
            <Grid item xs={12}>
                <Paper elevation={3} sx={{ boxShadow: 'none', color: 'text.secondary' }}>
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
                                left: {
                                    xs: `calc(100% * ${
                                        move.ply % 2 ? '2 / 12' : '7 / 12'
                                    } + 5px)`,
                                    md: `calc(100% * ${
                                        move.ply % 2 ? '2 / 12' : '7 / 12'
                                    } + 5px)`,
                                },
                                transform: 'rotate(45deg)',
                                backgroundColor: 'inherit',
                                backgroundImage: 'inherit',
                            },
                        }}
                    />

                    <Comment move={move} />

                    <Lines lines={move.variations} handleScroll={handleScroll} />

                    <Divider />
                </Paper>
            </Grid>
        </>
    );
};

export default Interrupt;
