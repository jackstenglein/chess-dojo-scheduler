import { Chess, Event, EventType } from '@jackstenglein/chess';
import { Grid, Paper } from '@mui/material';
import { useEffect, useState } from 'react';
import { useChess } from '../PgnBoard';
import MoveDisplay from './MoveDisplay';

interface VariationProps {
    handleScroll: (child: HTMLElement | null) => void;
}

const Variation: React.FC<VariationProps> = ({ handleScroll }) => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.Initialized,
                    EventType.DeleteMove,
                    EventType.DeleteBeforeMove,
                    EventType.PromoteVariation,
                    EventType.LegalMove,
                ],
                handler: (event: Event) => {
                    if (shouldRerender(event, chess)) {
                        setForceRender((v) => v + 1);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    return (
        <Paper sx={{ boxShadow: 'none' }}>
            <Grid container>
                {chess?.history().map((move) => {
                    return (
                        <MoveDisplay
                            move={move}
                            handleScroll={handleScroll}
                            key={move.ply}
                        />
                    );
                })}
            </Grid>
        </Paper>
    );
};

export default Variation;

/**
 * Returns true if the Variation component should rerender based on the given
 * event.
 * @param event The event that may trigger a rerender.
 * @param chess The chess instance.
 * @returns True if the Variation component should rerender.
 */
function shouldRerender(event: Event, chess: Chess): boolean {
    switch (event.type) {
        case EventType.Initialized:
        case EventType.DeleteBeforeMove:
            return true;

        case EventType.LegalMove:
            return chess.lastMove() === event.move;

        case EventType.DeleteMove:
            return Boolean(event.mainlineMove);

        case EventType.PromoteVariation:
            return chess.isInMainline(event.variantRoot);

        default:
            return false;
    }
}
