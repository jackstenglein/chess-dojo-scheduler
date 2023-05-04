import { useLayoutEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pgnView } from '@mliebelt/pgn-viewer';
import {
    Button,
    Grid,
    IconButton,
    Link as MuiLink,
    Stack,
    Typography,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

import { Game, isDefaultHeader } from '../database/game';
import { useAuth } from '../auth/Auth';
import GraduationIcon from '../scoreboard/GraduationIcon';

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
            <Grid item xs={8}>
                <Typography variant='body2'>{value}</Typography>
            </Grid>
        </>
    );
};

function formatSite(site: string) {
    if (!site) {
        return '';
    }
    if (site.includes('lichess.org')) {
        return 'Lichess';
    }
    if (site.includes('chess.com')) {
        return 'Chess.com';
    }
    return site;
}

interface GameDataProps {
    game: Game;
}

const GameData: React.FC<GameDataProps> = ({ game }) => {
    const headers = game.headers;
    const lichessUrl = useMemo(() => {
        const site = headers.Site;
        if (site?.startsWith('https://lichess.org/') && !site?.endsWith('.org/')) {
            return site;
        }
        return undefined;
    }, [headers.Site]);

    return (
        <Grid container alignItems='center' sx={{ pt: 2 }} columnGap={1}>
            {game.ownerDisplayName !== '' && (
                <>
                    <Grid item xs={3}>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Uploaded By
                        </Typography>
                    </Grid>
                    <Grid item xs={8}>
                        <Stack direction='row' spacing={1} alignItems='center'>
                            <Link to={`/profile/${game.owner}`}>
                                <Typography variant='body2'>
                                    {game.ownerDisplayName}
                                </Typography>
                            </Link>
                            <GraduationIcon cohort={game.ownerPreviousCohort} size={20} />
                        </Stack>
                    </Grid>
                </>
            )}
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

            {headers.Site && (
                <>
                    <Grid item xs={3}>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Site
                        </Typography>
                    </Grid>
                    <Grid item xs={8}>
                        <Stack direction='row' alignItems='center'>
                            <Typography variant='body2'>
                                {formatSite(headers.Site)}
                            </Typography>
                            {lichessUrl && (
                                <MuiLink
                                    href={lichessUrl}
                                    target='_blank'
                                    rel='noreferrer'
                                >
                                    <OpenInNewIcon
                                        sx={{
                                            fontSize: '1rem',
                                            position: 'relative',
                                            left: 4,
                                        }}
                                    />
                                </MuiLink>
                            )}
                        </Stack>
                    </Grid>
                </>
            )}

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
    onFeature: () => void;
}

const PgnViewer: React.FC<PgnViewerProps> = ({ game, onFeature }) => {
    const user = useAuth().user!;
    const navigate = useNavigate();

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
                    {game.owner === user.username && (
                        <Button
                            variant='contained'
                            sx={{ mb: 2 }}
                            onClick={() => navigate('edit')}
                        >
                            Update PGN
                        </Button>
                    )}
                    {user.isAdmin && (
                        <Stack direction='row' alignItems='center' spacing={2}>
                            <Typography>Feature Game?</Typography>
                            <IconButton onClick={onFeature}>
                                {game.isFeatured === 'true' ? (
                                    <CheckBoxIcon color='primary' />
                                ) : (
                                    <CheckBoxOutlineBlankIcon />
                                )}
                            </IconButton>
                        </Stack>
                    )}
                    <GameData game={game} />
                </Grid>

                <Grid item sm={12} md={8} lg={9}>
                    <div
                        id={id}
                        className={user.enableDarkMode ? 'dark' : undefined}
                    ></div>
                </Grid>
            </Grid>
        </Stack>
    );
};

export default PgnViewer;
