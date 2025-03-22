import { EventType, trackEvent } from '@/analytics/events';
import { RequestSnackbar, useRequest } from '@/api/Request';
import Board from '@/board/Board';
import { getLigaIconBasedOnTimeControl } from '@/components/calendar/eventViewer/LigaTournamentViewer';
import { Position as PositionModel } from '@/database/requirement';
import Icon from '@/style/Icon';
import { Computer } from '@mui/icons-material';
import CheckIcon from '@mui/icons-material/Check';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { LoadingButton } from '@mui/lab';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import axios from 'axios';
import copy from 'copy-to-clipboard';
import { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

export function turnColor(fen: string): 'white' | 'black' {
    const turn = fen.split(' ')[1];
    if (turn === 'b') {
        return 'black';
    }
    return 'white';
}

interface PositionProps {
    position: PositionModel;
    orientation?: 'white' | 'black';
}

const Position: React.FC<PositionProps> = ({ position, orientation }) => {
    const [copied, setCopied] = useState('');
    const lichessRequest = useRequest();

    const onCopy = (name: string) => {
        setCopied(name);
        setTimeout(() => {
            setCopied('');
        }, 3000);
    };

    const onCopyFen = () => {
        trackEvent(EventType.CopyFen, {
            position_fen: position.fen.trim(),
            position_name: position.title,
        });
        onCopy('fen');
    };

    const generateLichessUrl = () => {
        lichessRequest.onStart();
        axios
            .post<{ url: string }>('https://lichess.org/api/challenge/open', {
                'clock.limit': position.limitSeconds,
                'clock.increment': position.incrementSeconds,
                fen: position.fen.trim(),
                name: position.title,
            })
            .then((resp) => {
                trackEvent(EventType.CreateSparringLink, {
                    position_fen: position.fen.trim(),
                    position_name: position.title,
                    clock_limit: position.limitSeconds,
                    clock_increment: position.incrementSeconds,
                });
                lichessRequest.onSuccess();
                copy(resp.data.url);
                onCopy('lichess');
            })
            .catch((err) => {
                console.error(err);
                lichessRequest.onFailure(err);
            });
    };

    const turn = turnColor(position.fen);

    const timeControlName = getLigaIconBasedOnTimeControl(position.limitSeconds) ?? 'unknown';

    return (
        <Card variant='outlined' sx={{ px: 0, maxWidth: '386px' }}>
            <RequestSnackbar request={lichessRequest} />

            <CardHeader
                sx={{ px: 1 }}
                subheader={
                    <Stack px={1}>
                        <Stack direction='row' justifyContent='space-between'>
                            <Typography variant='h6'> {position.title}</Typography>
                            <Tooltip title={timeControlName.toLowerCase().concat(' time control')}>
                                <Typography>
                                    <Icon
                                        name={getLigaIconBasedOnTimeControl(position.limitSeconds)}
                                        color='dojoOrange'
                                        sx={{
                                            marginRight: '0.3',
                                            verticalAlign: 'middle',
                                        }}
                                    />{' '}
                                    {position.limitSeconds / 60}+{position.incrementSeconds}
                                </Typography>
                            </Tooltip>
                        </Stack>

                        <Stack direction='row' justifyContent='space-between'>
                            <Typography variant='body1' color='text.secondary'>
                                {turn[0].toLocaleUpperCase() + turn.slice(1)} to play
                                {position.result && ` and ${position.result.toLocaleLowerCase()}`}
                            </Typography>
                        </Stack>
                    </Stack>
                }
            />
            <CardContent sx={{ pt: 0, px: 1 }}>
                <Box sx={{ aspectRatio: '1 / 1' }}>
                    <Board
                        config={{
                            fen: position.fen.trim(),
                            viewOnly: true,
                            orientation: orientation || turn,
                        }}
                    />
                </Box>
            </CardContent>
            <CardActions disableSpacing sx={{ flexWrap: 'wrap', columnGap: 1 }}>
                <CopyToClipboard
                    data-cy='position-fen-copy'
                    text={position.fen.trim()}
                    onCopy={onCopyFen}
                >
                    <Tooltip title='Copy position FEN to clipboard'>
                        <Button
                            startIcon={
                                copied === 'fen' ? (
                                    <CheckIcon color='success' />
                                ) : (
                                    <ContentPasteIcon color='dojoOrange' />
                                )
                            }
                        >
                            FEN
                        </Button>
                    </Tooltip>
                </CopyToClipboard>

                <Tooltip title='Copy a URL and send to another player to play on Lichess'>
                    <LoadingButton
                        data-cy='position-challenge-url'
                        startIcon={
                            copied === 'lichess' ? (
                                <CheckIcon color='success' />
                            ) : (
                                <Icon name='spar' color='dojoOrange' />
                            )
                        }
                        loading={lichessRequest.isLoading()}
                        onClick={generateLichessUrl}
                    >
                        Challenge URL
                    </LoadingButton>
                </Tooltip>

                <Tooltip title='Open in position explorer'>
                    <Button
                        startIcon={<Icon name='explore' color='dojoOrange' />}
                        href={`/games/explorer?fen=${position.fen}`}
                        rel='noopener'
                        target='_blank'
                    >
                        Explorer
                    </Button>
                </Tooltip>

                <Tooltip title='Play against computer on Chess.com'>
                    <Button
                        startIcon={<Computer color='dojoOrange' />}
                        href={`https://www.chess.com/practice/custom?fen=${position.fen}&is960=false`}
                        target='_blank'
                        rel='noopener'
                    >
                        Play Computer
                    </Button>
                </Tooltip>
            </CardActions>
        </Card>
    );
};

export default Position;
