import { useLayoutEffect, useMemo } from 'react';
import { pgnView } from '@mliebelt/pgn-viewer';
import { Grid, Link, Stack, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

function getPgnData(pgn: string, key: string): string | undefined {
    const query = `[${key} "`;
    const index = pgn.indexOf(query);
    if (index >= 0) {
        const endIndex = pgn.indexOf(`"]`, index);
        let result = pgn.substring(index + query.length, endIndex);
        return result;
    }
}

interface GameDataProps {
    pgn: string;
}

const GameData: React.FC<GameDataProps> = ({ pgn }) => {
    const whiteName = useMemo(() => getPgnData(pgn, 'White'), [pgn]);
    const whiteElo = useMemo(() => getPgnData(pgn, 'WhiteElo'), [pgn]);
    const blackName = useMemo(() => getPgnData(pgn, 'Black'), [pgn]);
    const blackElo = useMemo(() => getPgnData(pgn, 'BlackElo'), [pgn]);
    const result = useMemo(() => getPgnData(pgn, 'Result'), [pgn]);
    const date = useMemo(() => getPgnData(pgn, 'Date'), [pgn]);

    const lichessUrl = useMemo(() => {
        const site = getPgnData(pgn, 'Site');
        if (site?.startsWith('https://lichess.org/') && !site?.endsWith('.org/')) {
            return site;
        }
        return undefined;
    }, [pgn]);

    return (
        <Grid container alignItems='center' sx={{ pt: 2 }}>
            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    White
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Typography variant='subtitle1'>
                    {whiteName} ({whiteElo})
                </Typography>
            </Grid>

            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    Black
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Typography variant='subtitle1'>
                    {blackName} ({blackElo})
                </Typography>
            </Grid>

            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    Result
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Typography variant='subtitle1'>{result}</Typography>
            </Grid>

            <Grid item xs={2}>
                <Typography variant='subtitle2' color='text.secondary'>
                    Date
                </Typography>
            </Grid>
            <Grid item xs={10}>
                <Typography variant='subtitle1'>{date}</Typography>
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
    pgn: string;
}

const PgnViewer: React.FC<PgnViewerProps> = ({ pgn }) => {
    const id = 'board';

    useLayoutEffect(() => {
        pgnView(id, {
            pgn: pgn,
            pieceStyle: 'wikipedia',
            theme: 'brown',
            showResult: true,
            notationLayout: 'list',
        });
    }, [id, pgn]);

    return (
        <Stack alignItems='center'>
            <Grid container rowSpacing={4}>
                <Grid item sm={12} md={4} lg={3}>
                    <GameData pgn={pgn} />
                </Grid>

                <Grid item sm={12} md={8} lg={9}>
                    <div id={id}></div>
                </Grid>
            </Grid>
        </Stack>
    );
};

export default PgnViewer;
