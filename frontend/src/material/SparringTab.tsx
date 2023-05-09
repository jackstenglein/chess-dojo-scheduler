import axios from 'axios';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Collapse,
    Divider,
    Grid,
    IconButton,
    Stack,
    Typography,
} from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import {
    sections,
    Position as PositionModel,
    CohortPositions as CohortPositionsModel,
    PositionSection,
} from './sparring';
import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useRequest } from '../api/Request';
import { LoadingButton } from '@mui/lab';

interface PositionProps {
    sectionTitle: string;
    position: PositionModel;
}

const Position: React.FC<PositionProps> = ({ sectionTitle, position }) => {
    const [copied, setCopied] = useState('');
    const lichessRequest = useRequest();

    const onCopy = (name: string) => {
        setCopied(name);
        setTimeout(() => {
            setCopied('');
        }, 3000);
    };

    const generateLichessUrl = () => {
        lichessRequest.onStart();
        axios
            .post('https://lichess.org/api/challenge/open', {
                'clock.limit': position.limitSeconds,
                'clock.increment': position.incrementSeconds,
                fen: position.fen,
                name: `${sectionTitle} ${position.title}`,
                rules: 'noAbort',
            })
            .then((resp) => {
                console.log('Generate Lichess URL: ', resp);
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
            <CardContent sx={{ pt: 0, px: 1, minWidth: '336px', height: '328px' }}>
                <iframe
                    src={position.link}
                    title={position.link}
                    frameBorder={0}
                    style={{ width: '100%', height: '100%' }}
                    scrolling='no'
                />
            </CardContent>
            <CardActions>
                <CopyToClipboard text={position.fen} onCopy={() => onCopy('fen')}>
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

interface CohortPositionsProps {
    sectionTitle: string;
    cohort: CohortPositionsModel;
}

const CohortPositions: React.FC<CohortPositionsProps> = ({ sectionTitle, cohort }) => {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        setOpen(!open);
    };

    return (
        <Box>
            <Stack direction='row' alignItems='center'>
                <IconButton size='small' onClick={toggleOpen}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
                <Typography
                    variant='subtitle1'
                    fontWeight='bold'
                    color='text.secondary'
                    onClick={toggleOpen}
                    sx={{ cursor: 'pointer' }}
                >
                    {cohort.cohort}
                </Typography>
            </Stack>

            <Collapse in={open} timeout='auto' unmountOnExit>
                <Grid container spacing={2}>
                    {cohort.positions.map((p) => (
                        <Grid item xs='auto' key={p.fen}>
                            <Position sectionTitle={sectionTitle} position={p} />
                        </Grid>
                    ))}
                </Grid>
            </Collapse>
        </Box>
    );
};

interface SparringSectionProps {
    section: PositionSection;
}

const SparringSection: React.FC<SparringSectionProps> = ({ section }) => {
    const [open, setOpen] = useState(false);
    const toggleOpen = () => {
        setOpen(!open);
    };

    return (
        <Box>
            <Stack direction='row' alignItems='center'>
                <IconButton size='small' onClick={toggleOpen}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
                <Typography variant='h6'>{section.title}</Typography>
            </Stack>
            <Divider />

            <Collapse in={open} timeout='auto' unmountOnExit>
                <Stack spacing={2}>
                    {section.cohorts.map((c) => (
                        <CohortPositions
                            key={c.cohort}
                            cohort={c}
                            sectionTitle={section.title}
                        />
                    ))}
                </Stack>
            </Collapse>
        </Box>
    );
};

const SparringTab = () => {
    return (
        <Stack spacing={3}>
            {sections.map((s) => (
                <SparringSection key={s.title} section={s} />
            ))}
        </Stack>
    );
};

export default SparringTab;
