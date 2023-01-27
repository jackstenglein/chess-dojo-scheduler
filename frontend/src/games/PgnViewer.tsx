import { useLayoutEffect, useMemo } from 'react';
import { pgnView } from '@mliebelt/pgn-viewer';
import { Grid, Link, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { Game, PgnHeaders } from '../database/game';

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
            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    White
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Typography variant='subtitle1'>
                    {headers.White} ({headers.WhiteElo ?? '?'})
                </Typography>
            </Grid>

            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    Black
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Typography variant='subtitle1'>
                    {headers.Black} ({headers.BlackElo ?? '?'})
                </Typography>
            </Grid>

            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    Result
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Typography variant='subtitle1'>{headers.Result}</Typography>
            </Grid>

            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    Date
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Typography variant='subtitle1'>{headers.Date}</Typography>
            </Grid>

            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    Site
                </Typography>
            </Grid>
            <Grid item xs={10}>
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

            {lichessUrl && (
                <Grid item xs={12} sx={{ pt: 1 }}>
                    <Link href={lichessUrl} target='_blank' rel='noreferrer'>
                        View on Lichess
                        <OpenInNewIcon
                            sx={{
                                fontSize: '1rem',
                                position: 'relative',
                                top: 2,
                                left: 4,
                            }}
                        />
                    </Link>
                </Grid>
            )}
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
