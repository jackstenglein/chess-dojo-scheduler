import {
    Card,
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    ToggleButtonProps,
    Tooltip,
} from '@mui/material';
import {
    AccessAlarm,
    Edit,
    Sell,
    Settings as SettingsIcon,
    Storage,
} from '@mui/icons-material';
import { useState } from 'react';

import { useLightMode } from '../../../../ThemeProvider';
import Tags from './Tags';
import Editor from './Editor';
import Explorer from '../../explorer/Explorer';
import { useChess } from '../../PgnBoard';
import { Game } from '../../../../database/game';
import Settings from './Settings';
import { useAuth } from '../../../../auth/Auth';
import ClockUsage from './ClockUsage';

interface UnderboardProps {
    showExplorer?: boolean;
    game?: Game;
    onSaveGame?: (g: Game) => void;
}

const Underboard: React.FC<UnderboardProps> = ({ showExplorer, game, onSaveGame }) => {
    const user = useAuth().user;
    const chess = useChess().chess;

    const showEditor = game && game.owner === user?.username;
    const [underboard, setUnderboard] = useState(
        showEditor ? 'editor' : Boolean(game) ? 'tags' : showExplorer ? 'explorer' : ''
    );
    const light = useLightMode();

    if (!showExplorer && !game) {
        return null;
    }

    return (
        <Card
            elevation={light ? undefined : 3}
            sx={{
                gridArea: 'underboard',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'none',
                maxHeight: { xl: 1 },
                mt: { xs: 1, xl: 0 },
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
                                borderRight: showEditor
                                    ? undefined
                                    : light
                                    ? 0
                                    : undefined,
                            }}
                        >
                            <AccessAlarm />
                        </UnderboardButton>

                        {showEditor && (
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
                        )}
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
                {underboard === 'settings' && game && (
                    <Settings game={game} onSaveGame={onSaveGame} />
                )}
                {underboard === 'clocks' && <ClockUsage showEditor={showEditor} />}
            </Stack>
        </Card>
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
