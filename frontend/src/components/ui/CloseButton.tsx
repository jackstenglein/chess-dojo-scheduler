import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton } from '@mui/material';
import grey from '@mui/material/colors/grey';
import { MouseEventHandler } from 'react';

interface CloseButtonProps {
    onClose?: (() => void) | MouseEventHandler<HTMLElement>;
}

export default function CloseButton({ onClose }: CloseButtonProps) {
    return (
        <Box display='relative'>
            <IconButton
                arra-label='close'
                onClick={(e) => onClose?.(e)}
                sx={{ right: '-8px', top: '-8px', display: 'absolute' }}
            >
                <CloseIcon sx={{ margin: 'auto', color: grey[500] }} fontSize='small' />
            </IconButton>
        </Box>
    );
}
