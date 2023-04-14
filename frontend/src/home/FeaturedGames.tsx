import {
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    Divider,
    Stack,
    Typography,
} from '@mui/material';
import { useEffect } from 'react';
import Carousel from 'react-material-ui-carousel';
import { Link, useNavigate } from 'react-router-dom';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { GameInfo } from '../database/game';
import LoadingPage from '../loading/LoadingPage';
import GraduationIcon from '../scoreboard/GraduationIcon';

interface HeaderDisplayProps {
    header: string;
    value: string;
}

const HeaderDisplay: React.FC<HeaderDisplayProps> = ({ header, value }) => {
    return (
        <Stack direction='row' spacing={2} alignItems='center'>
            <Typography variant='subtitle2' color='text.secondary'>
                {header}
            </Typography>
            <Typography variant='body2' textAlign='right'>
                {value}
            </Typography>
        </Stack>
    );
};

interface GameInfoCardProps {
    game: GameInfo;
}

const GameInfoCard: React.FC<GameInfoCardProps> = ({ game }) => {
    const navigate = useNavigate();

    const onClick = () => {
        navigate(
            `/games/${game.cohort.replaceAll('+', '%2B')}/${game.id.replaceAll(
                '?',
                '%3F'
            )}`
        );
    };

    const onClickLink = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        event.stopPropagation();
    };

    return (
        <Card variant='outlined'>
            <CardActionArea onClick={onClick}>
                <CardHeader
                    title={
                        <Stack direction='row' spacing={2}>
                            <Typography variant='h4'>
                                {'Annotation by '}
                                {game.ownerDisplayName ? (
                                    <Link
                                        to={`/profile/${game.owner}`}
                                        onClick={onClickLink}
                                    >
                                        {game.ownerDisplayName}
                                    </Link>
                                ) : (
                                    'Unknown'
                                )}
                            </Typography>
                            <GraduationIcon cohort={game.ownerPreviousCohort} />
                        </Stack>
                    }
                    subheader={
                        <Stack direction='row' alignItems='start'>
                            <Typography variant='h5'>{game.cohort}</Typography>
                        </Stack>
                    }
                />
                <CardContent>
                    <HeaderDisplay
                        header='White'
                        value={`${game.headers.White} (${game.headers.WhiteElo ?? '?'})`}
                    />
                    <HeaderDisplay
                        header='Black'
                        value={`${game.headers.Black} (${game.headers.BlackElo ?? '?'})`}
                    />
                    <HeaderDisplay header='Result' value={game.headers.Result} />
                    <HeaderDisplay header='Date' value={game.headers.Date} />
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

const FeaturedGames = () => {
    const api = useApi();
    const request = useRequest<GameInfo[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listFeaturedGames()
                .then((games) => request.onSuccess(games))
                .catch((err) => {
                    console.error('listFeaturedGames: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    console.log('Games: ', request.data);

    const games = request.data ?? [];

    return (
        <Stack spacing={3}>
            <RequestSnackbar request={request} />

            <Stack>
                <Typography variant='h6'>Featured Games</Typography>
                <Divider />
            </Stack>

            {games.length === 0 ? (
                request.isLoading() ? (
                    <LoadingPage />
                ) : (
                    <Typography>No featured games in the past month</Typography>
                )
            ) : (
                <Carousel
                    sx={{ overflow: 'visible', px: '70px' }}
                    navButtonsAlwaysVisible
                    autoPlay={false}
                >
                    {games.map((g) => (
                        <GameInfoCard key={g.id} game={g} />
                    ))}
                </Carousel>
            )}
        </Stack>
    );
};

export default FeaturedGames;
