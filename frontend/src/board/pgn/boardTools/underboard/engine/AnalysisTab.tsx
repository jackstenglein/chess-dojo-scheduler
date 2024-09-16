import { useChess } from '@/board/pgn/PgnBoard';
import { CardContent, Grid2, Grid2Props, List, Typography } from '@mui/material';
import { useLocalStorage } from 'usehooks-ts';
import { EngineName, LineEval } from '../../../../../stockfish/engine/eval';
import { useCurrentPosition } from '../../../../../stockfish/hooks/useCurrentPosition';
import EngineSettingsButton from './EngineSettingsButton';
import LineEvaluation from './LineEval';

export default function AnalysisTab(props: Grid2Props) {
    const [linesNumber] = useLocalStorage('engine-multi-pv', 3);
    const [engineName] = useLocalStorage('engine-name', EngineName.Stockfish11);
    const position = useCurrentPosition(engineName);

    const { chess } = useChess();
    const isGameOver = chess?.isGameOver();

    const linesSkeleton: LineEval[] = Array.from({ length: linesNumber }).map((_, i) => ({
        fen: '',
        pv: [`${i}`],
        depth: 0,
        multiPv: i + 1,
    }));

    const engineLines = position?.lines?.length ? position.lines : linesSkeleton;

    return (
        <CardContent>
            <Grid2
                container
                size={12}
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
                    <Grid2 size={12}>
                        <Typography align='center' fontSize='0.9rem'>
                            Game is over
                        </Typography>
                    </Grid2>
                )}

                <Grid2 container size={12} justifyContent='center' alignItems='center'>
                    <List sx={{ maxWidth: '95%', padding: 0 }}>
                        <EngineSettingsButton />

                        {!isGameOver &&
                            engineLines
                                .slice(0, linesNumber)
                                .map((line) => (
                                    <LineEvaluation key={line.multiPv} line={line} />
                                ))}
                    </List>
                </Grid2>
            </Grid2>
        </CardContent>
    );
}
