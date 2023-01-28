import { useLayoutEffect, useMemo } from 'react';
import { pgnView } from '@mliebelt/pgn-viewer';
import { Grid, Link, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { Game, isDefaultHeader, PgnHeaders } from '../database/game';

interface HeaderDisplayProps {
    header: string;
    value: string;
}

const HeaderDisplay: React.FC<HeaderDisplayProps> = ({ header, value }) => {
    return (
        <>
            <Grid item xs={3}>
                <Typography variant='subtitle2' color='text.secondary'>
                    {header}
                </Typography>
            </Grid>
            <Grid item xs={9}>
                <Typography variant='subtitle1'>{value}</Typography>
            </Grid>
        </>
    );
};

interface GameDataProps {
    headers: PgnHeaders;
}

const GameData: React.FC<GameDataProps> = ({ headers }) => {
    const lichessUrl = useMemo(() => {
        const site = headers.Site;
        if (site?.startsWith('https://lichess.org/') && !site?.endsWith('.org/')) {
            return site;
        }
        return undefined;
    }, [headers.Site]);

    return (
        <Grid container alignItems='center' sx={{ pt: 2 }}>
            <HeaderDisplay
                header='White'
                value={`${headers.White} (${headers.WhiteElo ?? '?'})`}
            />
            <HeaderDisplay
                header='Black'
                value={`${headers.Black} (${headers.BlackElo ?? '?'})`}
            />
            <HeaderDisplay header='Result' value={headers.Result} />
            <HeaderDisplay header='Date' value={headers.Date} />

            <Grid item xs={3}>
                <Typography variant='subtitle2' color='text.secondary'>
                    Site
                </Typography>
            </Grid>
            <Grid item xs={9}>
                <Stack direction='row'>
                    <Typography variant='subtitle1'>{headers.Site}</Typography>
                    {lichessUrl && (
                        <Link href={lichessUrl} target='_blank' rel='noreferrer'>
                            <OpenInNewIcon
                                sx={{
                                    fontSize: '1rem',
                                    position: 'relative',
                                    top: 2,
                                    left: 4,
                                }}
                            />
                        </Link>
                    )}
                </Stack>
            </Grid>

            {Object.entries(headers).map(([key, value]) => {
                if (isDefaultHeader(key)) {
                    return null;
                }
                return <HeaderDisplay key={key} header={key} value={value!} />;
            })}
        </Grid>
    );
};

interface PgnViewerProps {
    game: Game;
}

const PgnViewer: React.FC<PgnViewerProps> = ({ game }) => {
    const id = 'board';

    useLayoutEffect(() => {
        pgnView(id, {
            pgn: game.pgn,
            pieceStyle: 'wikipedia',
            theme: 'brown',
            showResult: true,
            notationLayout: 'list',
        });
    }, [id, game.pgn]);

    return (
        <Stack alignItems='center'>
            <Grid container rowSpacing={4}>
                <Grid item sm={12} md={4} lg={3}>
                    <GameData headers={game.headers} />
                </Grid>

                <Grid item sm={12} md={8} lg={9}>
                    <div id={id}></div>
                </Grid>
            </Grid>
        </Stack>
    );
};

export default PgnViewer;
