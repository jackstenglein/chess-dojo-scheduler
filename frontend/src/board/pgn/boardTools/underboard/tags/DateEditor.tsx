import { GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid-pro';
import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { parsePgnDate, toPgnDate } from '../../../../../api/gameApi';
import { TagRow } from './Tags';

export function EditDateCell(props: GridRenderEditCellParams<TagRow, string>) {
    const { id, value, field } = props;
    const apiRef = useGridApiContext();

    const handleChange = (newValue: DateTime<true> | null) => {
        void apiRef.current.setEditCellValue({ id, field, value: toPgnDate(newValue) });
    };

    return (
        <DatePicker
            autoFocus
            disableFuture
            value={parsePgnDate(value)}
            onChange={handleChange}
            sx={{
                width: 1,
                height: 1,
                '& .MuiOutlinedInput-root': { height: 1 },
                '& fieldset': { border: 0 },
            }}
        />
    );
}
