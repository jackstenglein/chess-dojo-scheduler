import useGame from '@/context/useGame';
import { useLightMode } from '@/style/useLightMode';
import {
    AccessAlarm,
    Chat,
    Edit,
    Folder,
    Sell,
    Settings as SettingsIcon,
    Share,
    Storage,
} from '@mui/icons-material';
import HelpIcon from '@mui/icons-material/Help';
import {
    Card,
    Paper,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    ToggleButtonProps,
    Tooltip,
} from '@mui/material';
import React, { forwardRef, Fragment, useImperativeHandle, useState } from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';
import { useLocalStorage } from 'usehooks-ts';
import { AuthStatus, useAuth } from '../../../../auth/Auth';
import { useChess } from '../../PgnBoard';
import ResizeHandle from '../../ResizeHandle';
import Explorer from '../../explorer/Explorer';
import { PlayerOpeningTreeProvider } from '../../explorer/player/PlayerOpeningTree';
import { ResizableData } from '../../resize';
import Editor from './Editor';
import ClockUsage from './clock/ClockUsage';
import Comments from './comments/Comments';
import { Directories } from './directories/Directories';
import GuideLinks from './guide/Guide';
import Settings from './settings/Settings';
import { ShortcutAction, ShortcutBindings } from './settings/ShortcutAction';
import { ShowGameGuide } from './settings/ViewerSettings';
import { ShareTab } from './share/ShareTab';
import Tags from './tags/Tags';
import {
    CustomUnderboardTab,
    DefaultUnderboardTab,
    DefaultUnderboardTabInfo,
    UnderboardTab,
} from './underboardTabs';

let tabInfo: Record<DefaultUnderboardTab, DefaultUnderboardTabInfo> = {
    [DefaultUnderboardTab.Directories]: {
        name: DefaultUnderboardTab.Directories,
        tooltip: 'Files',
        icon: <Folder />,
        shortcut: ShortcutAction.OpenFiles,
    },
    [DefaultUnderboardTab.Tags]: {
        name: DefaultUnderboardTab.Tags,
        tooltip: 'PGN Tags',
        icon: <Sell />,
        shortcut: ShortcutAction.OpenTags,
    },
    [DefaultUnderboardTab.Editor]: {
        name: DefaultUnderboardTab.Editor,
        tooltip: 'Edit PGN',
        icon: <Edit />,
        shortcut: ShortcutAction.OpenEditor,
    },
    [DefaultUnderboardTab.Comments]: {
        name: DefaultUnderboardTab.Comments,
        tooltip: 'Comments',
        icon: <Chat />,
        shortcut: ShortcutAction.OpenComments,
    },
    [DefaultUnderboardTab.Explorer]: {
        name: DefaultUnderboardTab.Explorer,
        tooltip: 'Position Database',
        icon: <Storage />,
        shortcut: ShortcutAction.OpenDatabase,
    },
    [DefaultUnderboardTab.Clocks]: {
        name: DefaultUnderboardTab.Clocks,
        tooltip: 'Clock Usage',
        icon: <AccessAlarm />,
        shortcut: ShortcutAction.OpenClocks,
    },
    [DefaultUnderboardTab.Share]: {
        name: DefaultUnderboardTab.Share,
        tooltip: 'Share',
        icon: <Share />,
        shortcut: ShortcutAction.OpenShare,
    },
    [DefaultUnderboardTab.Guide]: {
        name: DefaultUnderboardTab.Guide,
        tooltip: 'Guide',
        icon: <HelpIcon />,
        shortcut: ShortcutAction.OpenGuide,
    },
    [DefaultUnderboardTab.Settings]: {
        name: DefaultUnderboardTab.Settings,
        tooltip: 'Settings',
        icon: <SettingsIcon />,
        shortcut: ShortcutAction.OpenSettings,
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
        const [showGameGuide] = useLocalStorage<boolean>(
            ShowGameGuide.key,
            ShowGameGuide.default,
        );

        let displayTabs = [...tabs];

        if (showGameGuide) {
            const settingsIndex = displayTabs.findIndex(
                (t) => typeof t === 'string' && t === DefaultUnderboardTab.Settings,
            );

            if (settingsIndex !== -1) {
                displayTabs.splice(settingsIndex, 0, DefaultUnderboardTab.Guide);
            }
        }

        const [underboard, setUnderboard] = useState(
            initialTab
                ? initialTab
                : isOwner
                  ? DefaultUnderboardTab.Editor
                  : game
                    ? DefaultUnderboardTab.Tags
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

        const ExplorerWrapper = tabs.includes(DefaultUnderboardTab.Explorer)
            ? PlayerOpeningTreeProvider
            : Fragment;

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
                                onChange={(_, val: string | null) => val && setUnderboard(val)}
                                fullWidth
                            >
                                {displayTabs.map((tab, index) => {
                                    const info = getTabInfo(tab);

                                    return (
                                        <UnderboardButton
                                            key={info.name}
                                            tooltip={info.tooltip}
                                            value={info.name}
                                            shortcut={info.shortcut}
                                            sx={{
                                                borderTop: light ? 0 : undefined,

                                                borderLeft: index === 0 && light ? 0 : undefined,
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
                        {underboard === DefaultUnderboardTab.Directories && <Directories />}
                        {underboard === DefaultUnderboardTab.Tags && (
                            <Tags game={game} allowEdits={isOwner} />
                        )}
                        {underboard === DefaultUnderboardTab.Editor && (
                            <Editor focusEditor={focusEditor} setFocusEditor={setFocusEditor} />
                        )}
                        <ExplorerWrapper>
                            {underboard === DefaultUnderboardTab.Explorer && <Explorer />}
                        </ExplorerWrapper>
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
                        {underboard === DefaultUnderboardTab.Guide && ShowGameGuide && (
                            <GuideLinks />
                        )}
                        {underboard === DefaultUnderboardTab.Share && <ShareTab />}

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
    value: string;
    shortcut?: ShortcutAction;
}

const UnderboardButton: React.FC<UnderboardButtonProps> = ({
    children,
    value,
    tooltip,
    shortcut,
    ...props
}) => {
    const [keyBindings] = useLocalStorage(ShortcutBindings.key, ShortcutBindings.default);
    if (shortcut) {
        const binding = keyBindings[shortcut] || ShortcutBindings.default[shortcut];
        if (binding.key) {
            tooltip += ` (${binding.modifier ? `${binding.modifier}+` : ''}${binding.key})`;
        }
    }

    return (
        <Tooltip title={tooltip}>
            <ToggleButton data-cy={`underboard-button-${value}`} value={value} {...props}>
                {children}
            </ToggleButton>
        </Tooltip>
    );
};

export default Underboard;
