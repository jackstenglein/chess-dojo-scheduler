import { useEffect, useState } from 'react';
import { Move, EventType, Event } from '@jackstenglein/chess';
import { Grid, Paper } from '@mui/material';

import MoveDisplay from './MoveDisplay';
import { useChess } from '../PgnBoard';

interface VariationProps {
    scrollParent: HTMLDivElement | null;
    onClickMove: (m: Move) => void;
}

const Variation: React.FC<VariationProps> = ({ scrollParent, onClickMove }) => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.DeleteMove, EventType.PromoteVariation],
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
                            scrollParent={scrollParent}
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
