import { Typography } from '@mui/material';
import {
    GridToolbarColumnsButton,
    GridToolbarContainer,
    GridToolbarDensitySelector,
    GridToolbarFilterButton,
} from '@mui/x-data-grid-pro';

export function ScoreboardToolbar() {
    return (
        <GridToolbarContainer>
            <Typography
                variant='caption'
                color='text.secondary'
                sx={{ ml: 0.5, mt: 0.5, flexGrow: 1 }}
            >
                Tip: hold shift while scrolling to scroll horizontally
            </Typography>

            <GridToolbarColumnsButton />
            <GridToolbarDensitySelector />
            <GridToolbarFilterButton />
        </GridToolbarContainer>
    );
}
