import { useChess } from '@/board/pgn/PgnBoard';
import {
    ENGINE_LINE_COUNT,
    ENGINE_NAME,
    engines,
    LineEval,
} from '@/stockfish/engine/engine';
import { useEval } from '@/stockfish/hooks/useEval';
import { Paper, Stack, Switch, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { EvaluationSection } from './EvaluationSection';
import { getLineEvalLabel } from './LineEval';
import Settings from './Settings';

export default function EngineSection() {
    const [linesNumber] = useLocalStorage(
        ENGINE_LINE_COUNT.Key,
        ENGINE_LINE_COUNT.Default,
    );
    const [engineName] = useLocalStorage(ENGINE_NAME.Key, ENGINE_NAME.Default);

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
                <Stack direction='row' alignItems='center'>
                    <Tooltip title='Toggle Engine'>
                        <Switch
                            checked={enabled}
                            onChange={() => setEnabled((prev) => !prev)}
                            color='success'
                        />
                    </Tooltip>

                    {enabled && !isGameOver && (
                        <Typography variant='h5' sx={{ mr: 2, ml: 1 }}>
                            {getLineEvalLabel(engineLines[0])}
                        </Typography>
                    )}

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
                                {isGameOver ? (
                                    'Game Over'
                                ) : (
                                    <>
                                        Depth {engineLines[0].depth}
                                        <NodesPerSecond nps={engineLines[0].nps} />
                                    </>
                                )}
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

                {enabled && !isGameOver && (
                    <Stack>
                        {isGameOver ? (
                            <Typography align='center' fontSize='0.9rem'>
                                Game is over
                            </Typography>
                        ) : (
                            <EvaluationSection
                                allLines={engineLines}
                                maxLines={linesNumber}
                            />
                        )}
                    </Stack>
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
