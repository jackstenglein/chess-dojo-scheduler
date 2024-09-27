import { useChess } from '@/board/pgn/PgnBoard';
import {
    ENGINE_LINE_COUNT_KEY,
    ENGINE_NAME_KEY,
    EngineName,
    engines,
    LineEval,
} from '@/stockfish/engine/engine';
import { useCurrentPosition } from '@/stockfish/hooks/useCurrentPosition';
import {
    CardContent,
    Grid2,
    Grid2Props,
    List,
    Stack,
    Switch,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import LineEvaluation from './LineEval';
import Settings from './Settings';

export default function EngineSection(props: Grid2Props) {
    const [linesNumber] = useLocalStorage(ENGINE_LINE_COUNT_KEY, 3);
    const [engineName] = useLocalStorage(ENGINE_NAME_KEY, EngineName.Stockfish17);

    let engineInfo = engines.find((e) => e.name === engineName);
    if (!engineInfo) {
        engineInfo = engines[0];
    }

    const [enabled, setEnabled] = useState(false);
    const position = useCurrentPosition(enabled, engineInfo.name);

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
        <Stack sx={{ p: 1 }}>
            <Stack direction='row' alignItems='center'>
                <Tooltip title='Toggle Engine'>
                    <Switch
                        checked={enabled}
                        onChange={() => setEnabled((prev) => !prev)}
                        color='success'
                    />
                </Tooltip>

                <Stack sx={{ flexGrow: 1 }}>
                    <Typography
                        variant='caption'
                        sx={{ lineHeight: '1.2' }}
                        color='text.secondary'
                    >
                        {engineInfo.shortName}{' '}
                        <Tooltip title={engineInfo.techDescription}>
                            <Typography
                                component='span'
                                color='success'
                                variant='caption'
                            >
                                {engineInfo.tech}
                            </Typography>
                        </Tooltip>
                    </Typography>
                    <Typography
                        variant='caption'
                        sx={{ lineHeight: '1.2' }}
                        color='text.secondary'
                    >
                        {engineInfo.location}
                    </Typography>
                </Stack>

                <Settings />
            </Stack>

            {enabled && (
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

                        <Grid2
                            container
                            size={12}
                            justifyContent='center'
                            alignItems='center'
                        >
                            <Grid2
                                container
                                size={12}
                                justifyContent={'right'}
                                alignItems={'right'}
                            ></Grid2>

                            <List sx={{ maxWidth: '95%', padding: 0 }}>
                                {!isGameOver &&
                                    engineLines
                                        .slice(0, linesNumber)
                                        .map((line) => (
                                            <LineEvaluation
                                                key={line.multiPv}
                                                line={line}
                                            />
                                        ))}
                            </List>
                        </Grid2>
                    </Grid2>
                </CardContent>
            )}
        </Stack>
    );
}
