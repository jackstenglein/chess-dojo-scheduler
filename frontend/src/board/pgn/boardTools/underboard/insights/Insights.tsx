import { EventType } from '@jackstenglein/chess';
import { CardContent, Stack } from '@mui/material';
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
        <CardContent sx={{ height: 1, p: 0 }}>
            <Stack height={1}>
                <Stack flexGrow={1} sx={{ overflowY: 'auto', p: 2 }}>
                    <Stack direction='row' spacing={1}></Stack>
                </Stack>
            </Stack>
        </CardContent>
    );
}
