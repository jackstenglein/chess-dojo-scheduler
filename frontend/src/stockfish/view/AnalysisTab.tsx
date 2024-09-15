import { Grid, Grid2Props, List, Typography } from '@mui/material';
import { useAtomValue } from 'jotai';
import { LineEval } from '../engine/EngineEval';
import {
    boardAtom,
    engineMultiPvAtom,
    engineNameAtom,
    gameAtom,
} from '../engine/EngineState';
import { useCurrentPosition } from '../hooks/useCurrentPosition';
import EngineSettingsButton from './EngineSettingsButton';
import LineEvaluation from './LineEval';

export default function AnalysisTab(props: Grid2Props) {
    const linesNumber = useAtomValue(engineMultiPvAtom);
    const engineName = useAtomValue(engineNameAtom);
    const position = useCurrentPosition(engineName);
    const game = useAtomValue(gameAtom);
    const board = useAtomValue(boardAtom);

    const boardHistory = board.history();
    const gameHistory = game.history();

    const isGameOver =
        boardHistory.length > 0 &&
        (board.isCheckmate() ||
            board.isDraw() ||
            boardHistory.join() === gameHistory.join());

    const linesSkeleton: LineEval[] = Array.from({ length: linesNumber }).map((_, i) => ({
        pv: [`${i}`],
        depth: 0,
        multiPv: i + 1,
    }));

    const engineLines = position?.eval?.lines?.length
        ? position.eval.lines
        : linesSkeleton;

    return (
        <Grid
            item
            container
            xs={12}
            justifyContent='center'
            alignItems='start'
            height='100%'
            rowGap={1.2}
            {...props}
            sx={
                props.hidden
                    ? { display: 'none' }
                    : { overflow: 'hidden', overflowY: 'auto', ...props.sx }
            }
        >
            {isGameOver && (
                <Grid item xs={12}>
                    <Typography align='center' fontSize='0.9rem'>
                        Game is over
                    </Typography>
                </Grid>
            )}

            <Grid item container xs={12} justifyContent='center' alignItems='center'>
                <List sx={{ maxWidth: '95%', padding: 0 }}>
                    <EngineSettingsButton />
                    {!board.isCheckmate() &&
                        engineLines.map((line) => (
                            <LineEvaluation key={line.multiPv} line={line} />
                        ))}
                </List>
            </Grid>
        </Grid>
    );
}
