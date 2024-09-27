import { useChess } from '@/board/pgn/PgnBoard';
import {
    ENGINE_LINE_COUNT_KEY,
    ENGINE_NAME_KEY,
    EngineName,
    engines,
    LineEval,
} from '@/stockfish/engine/engine';
import { useEval } from '@/stockfish/hooks/useEval';
import {
    CardContent,
    Grid2,
    Grid2Props,
    List,
    Paper,
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
    const evaluation = useEval(enabled, engineInfo.name);

    const { chess } = useChess();
    const isGameOver = chess?.isGameOver();

    const engineLines = evaluation?.lines?.length
        ? evaluation.lines
        : (Array.from({ length: linesNumber }).map((_, i) => ({
              fen: '',
              pv: [`${i}`],
              depth: 0,
              multiPv: i + 1,
          })) as LineEval[]);

    return (
        <Paper
            elevation={6}
            sx={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                borderBottom: '1px solid',
                borderBottomColor: 'divider',
            }}
        >
            <Stack sx={{ p: 1 }}>
                <Stack gap={1} direction='row' alignItems='center'>
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

                        {enabled ? (
                            <Typography
                                variant='caption'
                                sx={{ lineHeight: '1.2' }}
                                color='text.secondary'
                            >
                                Depth {engineLines[0].depth}
                                <NodesPerSecond nps={engineLines[0].nps} />
                            </Typography>
                        ) : (
                            <Typography
                                variant='caption'
                                sx={{ lineHeight: '1.2' }}
                                color='text.secondary'
                            >
                                {engineInfo.location}
                            </Typography>
                        )}
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
                                    : {
                                          overflow: 'hidden',
                                          overflowY: 'auto',
                                          ...props.sx,
                                      }
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
        </Paper>
    );
}

function NodesPerSecond({ nps }: { nps?: number }) {
    if (!nps) {
        return null;
    }

    let text = '';
    if (nps > 1_000_000) {
        text = ` • ${Math.round(nps / 100_000) / 10} Mn/s`;
    } else {
        text = ` • ${Math.round(nps / 100) / 10} Kn/s`;
    }

    return (
        <Tooltip title='Nodes (positions searched) per second'>
            <span>{text}</span>
        </Tooltip>
    );
}
