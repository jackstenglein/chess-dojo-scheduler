import { Height } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { grey } from '@mui/material/colors';
import { forwardRef } from 'react';

interface ResizeHandleProps {
    dark?: boolean;
    position?: 'absolute';
    right?: number;
    bottom?: number;
    fontSize?: string;
}

const ResizeHandle = forwardRef<any, ResizeHandleProps>((props, ref) => {
    const { dark, position, right, bottom, fontSize, ...others } = props;
    return (
        <span
            ref={ref}
            style={{ position: position || 'relative', cursor: 'nwse-resize', right: 0 }}
            {...others}
        >
            <Tooltip title='Resize'>
                <Height
                    sx={{
                        position: 'absolute',
                        bottom: bottom || 0,
                        right: right || -2,
                        transform: 'rotate(-45deg)',
                        color: dark ? grey[700] : 'text.secondary',
                        fontSize: fontSize || '1.25rem',
                    }}
                />
            </Tooltip>
        </span>
    );
});

export default ResizeHandle;
