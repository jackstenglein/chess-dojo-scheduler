import {
    Box,
    Card,
    Container,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    Stack,
    Typography,
} from '@mui/material';
import { ModuleProps } from './Module';
import { Header } from '@jackstenglein/chess';
import { useState } from 'react';
import useMeasure from 'react-use-measure';

import PgnBoard from '../../board/pgn/PgnBoard';
import PgnErrorBoundary from '../../games/view/PgnErrorBoundary';

function getPgnName(header: Header): string {
    if (header.tags.PgnName) {
        return header.tags.PgnName;
    }

    return `${header.tags.White} - ${header.tags.Black}`;
}

interface PgnSelectorProps {
    pgns: string[];
    selectedIndex: number;
    setSelectedIndex: (i: number) => void;
}

const PgnSelector: React.FC<PgnSelectorProps> = ({
    pgns,
    selectedIndex,
    setSelectedIndex,
}) => {
    const headers = pgns.map((pgn) => new Header(pgn));

    return (
        <Card
            sx={{
                gridArea: 'extras',
                maxWidth: 1,
                maxHeight: '18em',
                overflowY: 'scroll',
            }}
        >
            <List>
                {headers.map((header, idx) => (
                    <ListItem key={idx} disablePadding>
                        <ListItemButton
                            sx={{ pl: 0 }}
                            selected={selectedIndex === idx}
                            onClick={() => setSelectedIndex(idx)}
                        >
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Stack alignItems='center' width={1}>
                                    <Typography
                                        sx={{
                                            color: 'primary.main',
                                        }}
                                    >
                                        {idx + 1}
                                    </Typography>
                                </Stack>
                            </ListItemIcon>
                            <Stack
                                direction='row'
                                justifyContent='space-between'
                                width={1}
                                spacing={1}
                            >
                                <Typography key={idx} variant='body2'>
                                    {getPgnName(header)}
                                </Typography>
                                <Typography variant='caption'>
                                    {header.tags.Result}
                                </Typography>
                            </Stack>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Card>
    );
};

const ModelGamesModule: React.FC<ModuleProps> = ({ module }) => {
    const [ref, bounds] = useMeasure();
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (!module.pgns || module.pgns.length < 1) {
        return null;
    }

    return (
        <Stack>
            <Container
                maxWidth={false}
                ref={ref}
                sx={{
                    pt: 4,
                    pb: 4,
                    px: '0 !important',
                    '--container-width': `${bounds.width}px`,
                    '--gap': '16px',
                    '--site-header-height': '80px',
                    '--site-header-margin': '100px',
                    '--player-header-height': '28px',
                    '--toc-width': '21vw',
                    '--coach-width': '400px',
                    '--tools-height': '40px',
                    '--board-width':
                        'calc(var(--container-width) - var(--coach-width) - 60px)',
                    '--board-height':
                        'calc(100vh - var(--site-header-height) - var(--site-header-margin) - var(--tools-height) - 8px - 2 * var(--player-header-height))',
                    '--board-size': 'calc(min(var(--board-width), var(--board-height)))',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        rowGap: '32px',
                        gridTemplateRows: {
                            xs: 'auto auto',
                        },
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'auto var(--board-size) var(--gap) var(--coach-width) auto',
                        },
                        gridTemplateAreas: {
                            xs: '"extras" "pgn"',
                            md: '". extras extras extras ." "pgn pgn pgn pgn pgn"',
                        },
                    }}
                >
                    <PgnSelector
                        pgns={module.pgns}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                    />

                    <PgnErrorBoundary pgn={module.pgns[selectedIndex]}>
                        <PgnBoard
                            key={module.pgns[selectedIndex]}
                            pgn={module.pgns[selectedIndex]}
                            showPlayerHeaders={true}
                            startOrientation={module.boardOrientation}
                        />
                    </PgnErrorBoundary>
                </Box>
            </Container>
        </Stack>
    );
};

export default ModelGamesModule;

// https://discord.com/channels/@me/1080486313721077850/1120781935673888920
