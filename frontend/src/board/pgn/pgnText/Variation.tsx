import { useEffect, useState } from 'react';
import { Move, EventType, Event } from '@jackstenglein/chess';
import { Grid, Paper } from '@mui/material';

import MoveDisplay from './MoveDisplay';
import { useChess } from '../PgnBoard';

interface VariationProps {
    handleScroll: (child: HTMLButtonElement | null) => void;
    onClickMove: (m: Move) => void;
}

const Variation: React.FC<VariationProps> = ({ handleScroll, onClickMove }) => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.DeleteMove,
                    EventType.PromoteVariation,
                    EventType.LegalMove,
                ],
                handler: (event: Event) => {
                    if (event.type === EventType.DeleteMove && !event.mainlineMove) {
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
                            onClickMove={onClickMove}
                            key={move.ply}
                        />
                    );
                })}
            </Grid>
        </Paper>
    );
};

export default Variation;
