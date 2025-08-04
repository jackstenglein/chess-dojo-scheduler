import { ShortcutAction } from './settings/ShortcutAction';

import type { JSX } from "react";

export enum DefaultUnderboardTab {
    Directories = 'directories',
    Tags = 'tags',
    Editor = 'editor',
    Comments = 'comments',
    Explorer = 'explorer',
    Clocks = 'clocks',
    Share = 'share',
    Settings = 'settings',
}

export interface DefaultUnderboardTabInfo {
    name: string;
    tooltip: string;
    icon: JSX.Element;
    shortcut?: ShortcutAction;
}

export interface CustomUnderboardTab extends Omit<DefaultUnderboardTabInfo, 'shortcut'> {
    element: JSX.Element;
}

export type UnderboardTab = DefaultUnderboardTab | CustomUnderboardTab;
