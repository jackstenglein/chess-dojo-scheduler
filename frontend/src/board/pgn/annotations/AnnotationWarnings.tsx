import { EventType, Move } from '@jackstenglein/chess';
import {
    Alert,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { useReconcile } from '../../Board';
import { compareNags, getStandardNag, nags } from '../Nag';
import { useChess } from '../PgnBoard';
import { getWarnings } from './warningRules';

function getMoveText(move: Move | null): string {
    if (!move) {
        return 'Starting Position';
    }

    let text = '';
    if (move.ply % 2 === 1) {
        text = `${Math.floor(move.ply / 2) + 1}. `;
    } else {
        text = `${Math.floor(move.ply / 2)}... `;
    }
    text += move.san;

    move.nags?.sort(compareNags).forEach((nag) => {
        const n = nags[getStandardNag(nag)];
        if (!n) return;

        text += n.label;
    });

    return text;
}

const AnnotationWarnings = () => {
    const { chess } = useChess();
    const [showDetails, setShowDetails] = useState(false);
    const [forceRender, setForceRender] = useState(0);
    const reconcile = useReconcile();

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.NewVariation,
                    EventType.UpdateComment,
                    EventType.DeleteMove,
                    EventType.DeleteBeforeMove,
                    EventType.UpdateNags,
                ],
                handler: () => {
                    setForceRender((v) => v + 1);
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    const warnings = useMemo(() => {
        if (forceRender >= 0) {
            return getWarnings(chess);
        }
        return [];
    }, [chess, forceRender]);

    if (Object.keys(warnings).length === 0) {
        return null;
    }

    const onClickMove = (move: Move | null) => {
        chess?.seek(move);
        reconcile();
        setShowDetails(false);
    };

    return (
        <Stack sx={{ mb: 1 }}>
            <Alert
                variant='filled'
                severity='warning'
                action={
                    <Button size='small' color='inherit' onClick={() => setShowDetails(true)}>
                        Details
                    </Button>
                }
                sx={{ alignItems: 'center' }}
            >
                {`Your annotations have ${Object.keys(warnings).length} warning${
                    Object.keys(warnings).length > 1 ? 's' : ''
                }.`}
            </Alert>

            <Dialog open={showDetails} onClose={() => setShowDetails(false)}>
                <DialogTitle component='div'>
                    <Typography variant='h5'>Annotation Warnings</Typography>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2}>
                        {Object.values(warnings).map((w) => (
                            <Stack key={w.displayName}>
                                <Typography variant='h6'>{w.displayName}</Typography>

                                <Typography>{w.description}</Typography>
                                <Stack
                                    mt={0.5}
                                    direction='row'
                                    spacing={1}
                                    alignItems='center'
                                    flexWrap='wrap'
                                >
                                    <Typography>Applicable Moves:</Typography>
                                    {w.moves.map((m, idx) => (
                                        <Button
                                            key={idx}
                                            variant='text'
                                            sx={{
                                                textTransform: 'none',
                                                width: 'fit-content',
                                                ml: -1,
                                            }}
                                            onClick={() => onClickMove(m)}
                                        >
                                            {getMoveText(m)}
                                        </Button>
                                    ))}
                                </Stack>
                            </Stack>
                        ))}
                    </Stack>
                </DialogContent>
            </Dialog>
        </Stack>
    );
};

export default AnnotationWarnings;
