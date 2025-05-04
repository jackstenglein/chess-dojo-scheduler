import { PopoverPosition } from '@mui/material';
import { GridRowId, GridRowSelectionModel } from '@mui/x-data-grid-pro';
import { useState } from 'react';

export interface DataGridContextMenu {
    rowIds: GridRowId[];
    position: PopoverPosition | undefined;
    open: (event: React.MouseEvent) => void;
    close: () => void;
}

/**
 * A hook that simplifies working with context menu's for the MUI Data Grid.
 * @returns The selected row id, the position of the menu and functions to open/close the menu.
 */
export function useDataGridContextMenu(
    rowSelectionModel?: GridRowSelectionModel,
): DataGridContextMenu {
    const [rowIds, setRowIds] = useState<GridRowId[]>([]);
    const [position, setPosition] = useState<PopoverPosition>();

    const open = (event: React.MouseEvent) => {
        event.preventDefault();

        if (rowSelectionModel && rowSelectionModel.ids.size > 0) {
            setRowIds([...rowSelectionModel.ids]);
        } else {
            setRowIds([event.currentTarget.getAttribute('data-id') || '']);
        }

        setPosition(position ? undefined : { left: event.clientX - 2, top: event.clientY - 4 });
    };

    const close = () => {
        setRowIds([]);
        setPosition(undefined);
    };

    return {
        rowIds,
        position,
        open,
        close,
    };
}
