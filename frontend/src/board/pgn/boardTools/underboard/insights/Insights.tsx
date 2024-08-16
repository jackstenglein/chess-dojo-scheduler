import AnnotationWarnings from '@/board/pgn/annotations/AnnotationWarnings';
import { EventType } from '@jackstenglein/chess';
import { CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useGame } from '../../../../../games/view/GamePage';
import { useChess } from '../../../PgnBoard';

export default function Insights() {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);
    const { game } = useGame();

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

    if (!game || !chess) {
        return null;
    }

    return (
        <CardContent>
            <Stack spacing={5} height={1}>
                <Stack spacing={2}>
                    <Typography variant='h5'>Annotations Feedback</Typography>
                    <AnnotationWarnings inplace={true} />
                </Stack>
            </Stack>
        </CardContent>
    );
}
