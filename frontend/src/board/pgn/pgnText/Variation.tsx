import { Event, EventType } from '@jackstenglein/chess';
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
                    EventType.PromoteVariation,
                    EventType.LegalMove,
                ],
                handler: (event: Event) => {
                    if (event.type === EventType.Initialized) {
                        setForceRender((v) => v + 1);
                    }
                    if (event.type === EventType.DeleteMove && event.mainlineMove) {
                        setForceRender((v) => v + 1);
                    }
                    if (
                        event.type === EventType.PromoteVariation &&
                        chess.isInMainline(event.variantRoot)
                    ) {
                        console.log('Variation forcing render: ', event);
                        setForceRender((v) => v + 1);
                    }
                    if (
                        event.type === EventType.LegalMove &&
                        chess.lastMove() === event.move
                    ) {
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
