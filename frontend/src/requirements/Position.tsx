import CheckIcon from '@mui/icons-material/Check';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { LoadingButton } from '@mui/lab';
import Icon from '../style/Icon';
import { getLigaIconBasedOnTimeControl } from '../calendar/eventViewer/LigaTournamentViewer';
import PawnIcon from '../navbar/PawnIcon';
import {
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

import { EventType, trackEvent } from '../analytics/events';
import { RequestSnackbar, useRequest } from '../api/Request';
import Board from '../board/Board';
import { Position as PositionModel } from '../database/requirement';

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
    const positionExp = new String("https://www.chessdojo.club/games/explorer?fen=");
    const expURL = positionExp.concat(position.fen);

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

    const onCopyExp = () => {
        trackEvent( EventType.CopyPositionExplorer, {
            position_exp_url: expURL,
        }
        );
        onCopy('exp');
    }

    const generateLichessUrl = () => {
        lichessRequest.onStart();
        axios
            .post('https://lichess.org/api/challenge/open', {
                'clock.limit': position.limitSeconds,
                'clock.increment': position.incrementSeconds,
                fen: position.fen.trim(),
                name: `${position.title}`,
            })
            .then((resp) => {
                console.log('Generate Lichess URL: ', resp);
                trackEvent(EventType.CreateSparringLink, {
                    position_fen: position.fen.trim(),
                    position_name: position.title,
                    clock_limit: position.limitSeconds,
                    clock_increment: position.incrementSeconds,
                });
                lichessRequest.onSuccess();
                copy(resp.data.challenge.url);
                onCopy('lichess');
            })
            .catch((err) => {
                console.error(err);
                lichessRequest.onFailure(err);
            });
    };

    const turn = turnColor(position.fen);

    return (
        <Card variant='outlined' sx={{ px: 0 }}>
            <RequestSnackbar request={lichessRequest} />

            <CardHeader
                sx={{ px: 1 }}
                subheader={
                    <Stack px={1}>
                        <Stack direction='row' justifyContent='space-between'>
                            <Typography variant='h6'> {position.title}</Typography>
                            <Tooltip title={getLigaIconBasedOnTimeControl(position.limitSeconds).toLowerCase().concat(" time control")}>
                            <Typography>
                                <Icon name={getLigaIconBasedOnTimeControl(position.limitSeconds)} color='dojoOrange' sx={{marginRight: "0.3", verticalAlign: "middle"}}/> {position.limitSeconds / 60}+{position.incrementSeconds} 
                            </Typography>
                            </Tooltip>
                          
                        </Stack>

                        <Stack direction='row' justifyContent='space-between'>
                            <Typography variant='body1' color='text.secondary'>
                                {turn[0].toLocaleUpperCase() + turn.slice(1)} to play
                                {position.result &&
                                    ` and ${position.result.toLocaleLowerCase()}`}
                            </Typography>
                        </Stack>
                    </Stack>
                }
            />
            <CardContent sx={{ pt: 0, px: 1, width: '336px', height: '336px' }}>
                <Board
                    config={{
                        fen: position.fen.trim(),
                        viewOnly: true,
                        orientation: orientation || turn,
                    }}
                />
            </CardContent>
            <CardActions>
                
                <CopyToClipboard
                    data-cy='position-fen-copy'
                    text={position.fen.trim()}
                    onCopy={onCopyFen}
                >   
                    <Tooltip title='Copy position FEN to clipboard'>  
                    <Button
                        startIcon={
                            copied === 'fen' ? <CheckIcon color='success'/> : <ContentPasteIcon color='dojoOrange'/>
                        }
                    >
                        {copied === 'fen' ? 'Copied' : 'FEN'}
                    </Button>
                    </Tooltip>
                    
                </CopyToClipboard>
                
                    <Tooltip title='Open this in position explorer'>  
                    <Button
                        startIcon={
                            copied === 'exp' ? <CheckIcon color='success'/> : <Icon name='explore' color='dojoOrange'/>
                        }
                        href={expURL}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {copied === 'exp' ? 'Copied' : 'Explorer'}
                    </Button>
                    </Tooltip>
   
                <Tooltip title='Copy a URL and send to another player to play on Lichess'>
                <LoadingButton
                    data-cy='position-challenge-url'
                    startIcon={
                        copied === 'lichess' ? <CheckIcon color='success'/> : <Icon name='spar' color='dojoOrange'/>
                    }
                    loading={lichessRequest.isLoading()}
                    onClick={generateLichessUrl}
                >
                    {copied === 'lichess' ? 'Copied' : 'Challenge URL'}
                </LoadingButton>
                </Tooltip>
            </CardActions>
        </Card>
    );
};

export default Position;
