import {
    AccessAlarm,
    Chat,
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
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { useAuth } from '../../../../auth/Auth';
import { useGame } from '../../../../games/view/GamePage';
import { useLightMode } from '../../../../ThemeProvider';
import Explorer from '../../explorer/Explorer';
import { useChess } from '../../PgnBoard';
import { ResizableData } from '../../resize';
import ResizeHandle from '../../ResizeHandle';
import ClockUsage from './ClockUsage';
import Comments from './comments/Comments';
import Editor from './Editor';
import Settings from './settings/Settings';
import Tags from './Tags';

export enum UnderboardTab {
    Tags = 'tags',
    Editor = 'editor',
    Comments = 'comments',
    Explorer = 'explorer',
    Clocks = 'clocks',
    Settings = 'settings',
}

export interface UnderboardApi {
    switchTab: (tab: UnderboardTab) => void;
    focusEditor: () => void;
    focusCommenter: () => void;
}

interface UnderboardProps {
    resizeData: ResizableData;
    onResize: (width: number, height: number) => void;
    showExplorer?: boolean;
}

const Underboard = forwardRef<UnderboardApi, UnderboardProps>(
    ({ resizeData, onResize }, ref) => {
        const user = useAuth().user;
        const { chess } = useChess();
        const { game } = useGame();
        const [focusEditor, setFocusEditor] = useState(false);
        const [focusCommenter, setFocusCommenter] = useState(false);

        const showEditor = game && game.owner === user?.username;
        const [underboard, setUnderboard] = useState(
            showEditor
                ? UnderboardTab.Editor
                : Boolean(game)
                  ? UnderboardTab.Comments
                  : UnderboardTab.Explorer,
        );
        const light = useLightMode();

        useImperativeHandle(
            ref,
            () => {
                return {
                    switchTab(tab: UnderboardTab) {
                        setUnderboard(tab);
                    },
                    focusEditor() {
                        if (showEditor) {
                            setUnderboard(UnderboardTab.Editor);
                            setFocusEditor(true);
                        } else {
                            setUnderboard(UnderboardTab.Comments);
                            setFocusCommenter(true);
                        }
                    },
                    focusCommenter() {
                        setUnderboard(UnderboardTab.Comments);
                        setFocusCommenter(true);
                    },
                };
            },
            [setUnderboard, showEditor, setFocusEditor, setFocusCommenter],
        );

        const handleResize = (_: React.SyntheticEvent, data: ResizeCallbackData) => {
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
                        visibility: chess ? undefined : 'hidden',
                    }}
                    variant={light ? 'outlined' : 'elevation'}
                >
                    {game && (
                        <Paper elevation={10} sx={{ boxShadow: 'none' }}>
                            <ToggleButtonGroup
                                size='small'
                                exclusive
                                value={underboard}
                                onChange={(_, val) => val && setUnderboard(val)}
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
                                    tooltip='Comments'
                                    value='comments'
                                    sx={{ borderTop: light ? 0 : undefined }}
                                >
                                    <Chat />
                                </UnderboardButton>

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

                    <Stack sx={{ overflowY: 'auto', flexGrow: 1 }}>
                        {underboard === 'tags' && (
                            <Tags
                                tags={chess?.pgn.header.tags}
                                game={game}
                                allowEdits={showEditor}
                            />
                        )}
                        {underboard === 'editor' && (
                            <Editor
                                focusEditor={focusEditor}
                                setFocusEditor={setFocusEditor}
                            />
                        )}
                        {underboard === 'explorer' && <Explorer />}
                        {underboard === 'settings' && (
                            <Settings showEditor={showEditor} />
                        )}
                        {underboard === 'clocks' && (
                            <ClockUsage showEditor={showEditor} />
                        )}
                        {underboard === 'comments' && (
                            <Comments
                                focusEditor={focusCommenter}
                                setFocusEditor={setFocusCommenter}
                            />
                        )}
                    </Stack>
                </Card>
            </Resizable>
        );
    },
);

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
