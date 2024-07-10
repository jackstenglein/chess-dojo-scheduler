import { useLightMode } from '@/style/useLightMode';
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
import { AuthStatus, useAuth } from '../../../../auth/Auth';
import { useGame } from '../../../../games/view/GamePage';
import { useLightMode } from '../../../../style/ThemeProvider';
import { useChess } from '../../PgnBoard';
import ResizeHandle from '../../ResizeHandle';
import Explorer from '../../explorer/Explorer';
import { ResizableData } from '../../resize';
import ClockUsage from './ClockUsage';
import Editor from './Editor';
import Comments from './comments/Comments';
import Settings from './settings/Settings';
import Tags from './tags/Tags';

export enum DefaultUnderboardTab {
    Tags = 'tags',
    Editor = 'editor',
    Comments = 'comments',
    Explorer = 'explorer',
    Clocks = 'clocks',
    Settings = 'settings',
}

export interface DefaultUnderboardTabInfo {
    name: string;
    tooltip: string;
    icon: JSX.Element;
}

export interface CustomUnderboardTab extends DefaultUnderboardTabInfo {
    element: JSX.Element;
}

export type UnderboardTab = DefaultUnderboardTab | CustomUnderboardTab;

const tabInfo: Record<DefaultUnderboardTab, DefaultUnderboardTabInfo> = {
    [DefaultUnderboardTab.Tags]: {
        name: DefaultUnderboardTab.Tags,
        tooltip: 'PGN Tags',
        icon: <Sell />,
    },
    [DefaultUnderboardTab.Editor]: {
        name: DefaultUnderboardTab.Editor,
        tooltip: 'Edit PGN',
        icon: <Edit />,
    },
    [DefaultUnderboardTab.Comments]: {
        name: DefaultUnderboardTab.Comments,
        tooltip: 'Comments',
        icon: <Chat />,
    },
    [DefaultUnderboardTab.Explorer]: {
        name: DefaultUnderboardTab.Explorer,
        tooltip: 'Position Database',
        icon: <Storage />,
    },
    [DefaultUnderboardTab.Clocks]: {
        name: DefaultUnderboardTab.Clocks,
        tooltip: 'Clock Usage',
        icon: <AccessAlarm />,
    },
    [DefaultUnderboardTab.Settings]: {
        name: DefaultUnderboardTab.Settings,
        tooltip: 'Settings',
        icon: <SettingsIcon />,
    },
};

function getTabInfo(tab: UnderboardTab): DefaultUnderboardTabInfo {
    if (typeof tab === 'string') {
        return tabInfo[tab];
    }
    return tab;
}

export interface UnderboardApi {
    switchTab: (tab: DefaultUnderboardTab) => void;
    focusEditor: () => void;
    focusCommenter: () => void;
}

interface UnderboardProps {
    tabs: UnderboardTab[];
    initialTab?: string;
    resizeData: ResizableData;
    onResize: (width: number, height: number) => void;
}

const Underboard = forwardRef<UnderboardApi, UnderboardProps>(
    ({ tabs, initialTab, resizeData, onResize }, ref) => {
        const auth = useAuth();
        const { chess } = useChess();
        const { game, isOwner } = useGame();
        const [focusEditor, setFocusEditor] = useState(false);
        const [focusCommenter, setFocusCommenter] = useState(false);

        const [underboard, setUnderboard] = useState(
            initialTab
                ? initialTab
                : isOwner
                  ? DefaultUnderboardTab.Editor
                  : game
                    ? DefaultUnderboardTab.Comments
                    : DefaultUnderboardTab.Explorer,
        );
        const light = useLightMode();

        useImperativeHandle(ref, () => {
            return {
                switchTab(tab: DefaultUnderboardTab) {
                    if (tabs.includes(tab)) {
                        setUnderboard(tab);
                    }
                },
                focusEditor() {
                    if (isOwner) {
                        setUnderboard(DefaultUnderboardTab.Editor);
                        setFocusEditor(true);
                    } else if (tabs.includes(DefaultUnderboardTab.Comments)) {
                        setUnderboard(DefaultUnderboardTab.Comments);
                        setFocusCommenter(true);
                    }
                },
                focusCommenter() {
                    if (tabs.includes(DefaultUnderboardTab.Comments)) {
                        setUnderboard(DefaultUnderboardTab.Comments);
                        setFocusCommenter(true);
                    }
                },
            };
        }, [tabs, setUnderboard, isOwner, setFocusEditor, setFocusCommenter]);

        const handleResize = (_: React.SyntheticEvent, data: ResizeCallbackData) => {
            onResize(Math.floor(data.size.width), Math.floor(data.size.height));
        };

        const isAuthenticated = auth.status === AuthStatus.Authenticated;

        if (tabs.length === 0) {
            return null;
        }

        const customTab = tabs.find(
            (t) => typeof t !== 'string' && t.name === underboard,
        ) as CustomUnderboardTab;

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
                    {tabs.length > 1 && (
                        <Paper elevation={10} sx={{ boxShadow: 'none' }}>
                            <ToggleButtonGroup
                                size='small'
                                exclusive
                                value={underboard}
                                onChange={(_, val: string | null) =>
                                    val && setUnderboard(val)
                                }
                                fullWidth
                            >
                                {tabs.map((tab, index) => {
                                    const info = getTabInfo(tab);

                                    return (
                                        <UnderboardButton
                                            key={info.name}
                                            tooltip={info.tooltip}
                                            value={info.name}
                                            sx={{
                                                borderTop: light ? 0 : undefined,

                                                borderLeft:
                                                    index === 0 && light ? 0 : undefined,
                                                borderRight:
                                                    index === tabs.length - 1 && light
                                                        ? 0
                                                        : undefined,

                                                borderBottomRightRadius: 0,
                                                borderBottomLeftRadius: 0,
                                            }}
                                        >
                                            {info.icon}
                                        </UnderboardButton>
                                    );
                                })}
                            </ToggleButtonGroup>
                        </Paper>
                    )}

                    <Stack sx={{ overflowY: 'auto', flexGrow: 1 }}>
                        {underboard === DefaultUnderboardTab.Tags && (
                            <Tags game={game} allowEdits={isOwner} />
                        )}
                        {underboard === DefaultUnderboardTab.Editor && (
                            <Editor
                                focusEditor={focusEditor}
                                setFocusEditor={setFocusEditor}
                            />
                        )}
                        {underboard === DefaultUnderboardTab.Explorer && <Explorer />}
                        {underboard === DefaultUnderboardTab.Settings && (
                            <Settings showEditor={isOwner} />
                        )}
                        {underboard === DefaultUnderboardTab.Clocks && (
                            <ClockUsage showEditor={isOwner} />
                        )}
                        {underboard === DefaultUnderboardTab.Comments && (
                            <Comments
                                isReadonly={!isAuthenticated}
                                focusEditor={focusCommenter}
                                setFocusEditor={setFocusCommenter}
                            />
                        )}

                        {customTab?.element}
                    </Stack>
                </Card>
            </Resizable>
        );
    },
);
Underboard.displayName = 'Underboard';

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
