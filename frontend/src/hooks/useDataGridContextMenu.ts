import { PopoverPosition } from '@mui/material';
import { useState } from 'react';

/**
 * A hook that simplifies working with context menu's for the MUI Data Grid.
 * @returns The selected row id, the position of the menu and functions to open/close the menu.
 */
export function useDataGridContextMenu() {
    const [rowId, setRowId] = useState('');
    const [position, setPosition] = useState<PopoverPosition>();

    const open = (event: React.MouseEvent) => {
        event.preventDefault();
        setRowId(event.currentTarget.getAttribute('data-id') || '');
        setPosition(
            position ? undefined : { left: event.clientX - 2, top: event.clientY - 4 },
        );
    };

    const close = () => {
        setRowId('');
        setPosition(undefined);
    };

    return {
        rowId,
        position,
        open,
        close,
    };
}
