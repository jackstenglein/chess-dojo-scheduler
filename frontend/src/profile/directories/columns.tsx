import { gameTableColumns } from '@/components/games/list/GameTable';
import { GameInfo } from '@/database/game';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid';

export const columns = gameTableColumns
    .filter((c) => c.field !== 'owner')
    .concat({
        field: 'unlisted',
        headerName: 'Visibility',
        align: 'center',
        headerAlign: 'center',
        minWidth: 75,
        width: 75,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => {
            if (params.row.unlisted) {
                return (
                    <Tooltip title='Unlisted'>
                        <VisibilityOff sx={{ color: 'text.secondary', height: 1 }} />
                    </Tooltip>
                );
            }
            return (
                <Tooltip title='Public'>
                    <Visibility sx={{ color: 'text.secondary', height: 1 }} />
                </Tooltip>
            );
        },
    });
