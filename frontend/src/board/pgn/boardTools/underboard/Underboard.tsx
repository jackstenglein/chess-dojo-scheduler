import {
    AccessAlarm,
    Edit,
    Sell,
    Settings as SettingsIcon,
    Storage,
} from '@mui/icons-material';
import {
    Card,
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    ToggleButtonProps,
    Tooltip,
} from '@mui/material';
import React, { useState } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';

import { useAuth } from '../../../../auth/Auth';
import { Game } from '../../../../database/game';
import { useLightMode } from '../../../../ThemeProvider';
import Explorer from '../../explorer/Explorer';
import { useChess } from '../../PgnBoard';
import { ResizableData } from '../../resize';
import ResizeHandle from '../../ResizeHandle';
import ClockUsage from './ClockUsage';
import Editor from './Editor';
import Settings from './settings/Settings';
import Tags from './Tags';

interface UnderboardProps {
    resizeData: ResizableData;
    onResize: (width: number, height: number) => void;
    showExplorer?: boolean;
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

const Underboard: React.FC<UnderboardProps> = ({
    resizeData,
    onResize,
    showExplorer,
    game,
    onSaveGame,
}) => {
    const user = useAuth().user;
    const chess = useChess().chess;

    const showEditor = game && game.owner === user?.username;
    const [underboard, setUnderboard] = useState(
        showEditor ? 'editor' : Boolean(game) ? 'tags' : showExplorer ? 'explorer' : '',
    );
    const light = useLightMode();

    if (!showExplorer && !game) {
        return null;
    }

    const handleResize = (_: React.SyntheticEvent, data: ResizeCallbackData) => {
        console.log('Resizing underboard (currentSize, newSize): ', resizeData, data);
        onResize(Math.floor(data.size.width), Math.floor(data.size.height));
    };

    return (
        <Resizable
            width={resizeData.width}
            height={resizeData.height}
            onResize={handleResize}
            minConstraints={[resizeData.minWidth, resizeData.minHeight]}
            maxConstraints={[resizeData.maxWidth, resizeData.maxHeight]}
            handle={<ResizeHandle />}
        >
            <Card
                elevation={light ? undefined : 3}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'none',
                    maxHeight: { xl: 1 },
                    mt: { xs: 1, xl: 0 },
                    width: `${resizeData.width}px`,
                    height: `${resizeData.height}px`,
                    order: resizeData.order,
                }}
                variant={light ? 'outlined' : 'elevation'}
            >
                {game && (
                    <Paper elevation={10} sx={{ boxShadow: 'none' }}>
                        <ToggleButtonGroup
                            size='small'
                            exclusive
                            value={underboard}
                            onChange={(_, val) => setUnderboard(val)}
                            fullWidth
                        >
                            <UnderboardButton
                                tooltip='PGN Tags'
                                value='tags'
                                sx={{
                                    borderBottomLeftRadius: 0,
                                    borderTop: light ? 0 : undefined,
                                    borderLeft: light ? 0 : undefined,
                                }}
                            >
                                <Sell />
                            </UnderboardButton>

                            {showEditor && (
                                <UnderboardButton
                                    tooltip='Edit PGN'
                                    value='editor'
                                    sx={{
                                        borderTop: light ? 0 : undefined,
                                    }}
                                >
                                    <Edit />
                                </UnderboardButton>
                            )}

                            <UnderboardButton
                                tooltip='Position Database'
                                value='explorer'
                                sx={{
                                    borderTop: light ? 0 : undefined,
                                }}
                            >
                                <Storage />
                            </UnderboardButton>

                            <UnderboardButton
                                tooltip='Clock Usage'
                                value='clocks'
                                sx={{
                                    borderBottomRightRadius: 0,
                                    borderTop: light ? 0 : undefined,
                                }}
                            >
                                <AccessAlarm />
                            </UnderboardButton>

                            <UnderboardButton
                                tooltip='Settings'
                                value='settings'
                                sx={{
                                    borderTop: light ? 0 : undefined,
                                    borderRight: light ? 0 : undefined,
                                    borderBottomRightRadius: 0,
                                }}
                            >
                                <SettingsIcon />
                            </UnderboardButton>
                        </ToggleButtonGroup>
                    </Paper>
                )}

                <Stack sx={{ overflowY: 'scroll', flexGrow: 1 }}>
                    {underboard === 'tags' && (
                        <Tags
                            tags={chess?.pgn.header.tags}
                            game={game}
                            allowEdits={showEditor}
                        />
                    )}
                    {underboard === 'editor' && <Editor />}
                    {underboard === 'explorer' && <Explorer />}
                    {underboard === 'settings' && (
                        <Settings
                            showEditor={showEditor}
                            game={game}
                            onSaveGame={onSaveGame}
                        />
                    )}
                    {underboard === 'clocks' && <ClockUsage showEditor={showEditor} />}
                </Stack>
            </Card>
        </Resizable>
    );
};

interface UnderboardButtonProps extends ToggleButtonProps {
    tooltip: string;
}

const UnderboardButton: React.FC<UnderboardButtonProps> = ({
    children,
    value,
    tooltip,
    ...props
}) => {
    return (
        <Tooltip title={tooltip}>
            <ToggleButton data-cy={value} value={value} {...props}>
                {children}
            </ToggleButton>
        </Tooltip>
    );
};

export default Underboard;
