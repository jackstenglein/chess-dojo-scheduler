import { useState } from 'react';
import axios from 'axios';
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Stack,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckIcon from '@mui/icons-material/Check';
import CopyToClipboard from 'react-copy-to-clipboard';

import { Position as PositionModel } from '../database/requirement';
import { useRequest } from '../api/Request';
import { EventType, trackEvent } from '../analytics/events';
import Board from '../board/Board';

interface PositionProps {
    position: PositionModel;
}

const Position: React.FC<PositionProps> = ({ position }) => {
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
            position_fen: position.fen,
            position_name: position.title,
        });
        onCopy('fen');
    };

    const generateLichessUrl = () => {
        lichessRequest.onStart();
        axios
            .post('https://lichess.org/api/challenge/open', {
                'clock.limit': position.limitSeconds,
                'clock.increment': position.incrementSeconds,
                fen: position.fen,
                name: `${position.title}`,
                rules: 'noAbort',
            })
            .then((resp) => {
                console.log('Generate Lichess URL: ', resp);
                trackEvent(EventType.CreateSparringLink, {
                    position_fen: position.fen,
                    position_name: position.title,
                    clock_limit: position.limitSeconds,
                    clock_increment: position.incrementSeconds,
                });
                lichessRequest.onSuccess();
                navigator.clipboard.writeText(resp.data.challenge.url);
                onCopy('lichess');
            })
            .catch((err) => {
                console.error(err);
                lichessRequest.onFailure(err);
            });
    };

    return (
        <Card variant='outlined' sx={{ px: 0 }}>
            <CardHeader
                sx={{ px: 1 }}
                subheader={
                    <Stack px={1}>
                        <Stack direction='row' justifyContent='space-between'>
                            <Typography>{position.title}</Typography>
                            <Typography>
                                {position.limitSeconds / 60}+{position.incrementSeconds}
                            </Typography>
                        </Stack>
                        {position.result && (
                            <Typography
                                variant='overline'
                                color='text.secondary'
                                sx={{ mb: -1 }}
                            >
                                {position.result}
                            </Typography>
                        )}
                    </Stack>
                }
            />
            <CardContent sx={{ pt: 0, px: 1, width: '336px', height: '336px' }}>
                <Board config={{ fen: position.fen, viewOnly: true }} />
            </CardContent>
            <CardActions>
                <CopyToClipboard text={position.fen} onCopy={onCopyFen}>
                    <Button
                        startIcon={
                            copied === 'fen' ? <CheckIcon /> : <ContentPasteIcon />
                        }
                    >
                        {copied === 'fen' ? 'Copied' : 'FEN'}
                    </Button>
                </CopyToClipboard>
                <LoadingButton
                    startIcon={
                        copied === 'lichess' ? <CheckIcon /> : <ContentPasteIcon />
                    }
                    loading={lichessRequest.isLoading()}
                    onClick={generateLichessUrl}
                >
                    {copied === 'lichess' ? 'Copied' : 'Challenge URL'}
                </LoadingButton>
            </CardActions>
        </Card>
    );
};

export default Position;
