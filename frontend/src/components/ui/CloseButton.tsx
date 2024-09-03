import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, IconButtonProps } from '@mui/material';
import grey from '@mui/material/colors/grey';

interface CloseButtonPropsOwn {
    onClose: () => void;
}

type CloseButtonProps = IconButtonProps & CloseButtonPropsOwn;

export default function CloseButton({ onClose, ...iconButtonProps }: CloseButtonProps) {
    iconButtonProps.sx = {
        // Compensate for padding while maintaining hover effect area.
        right: '-8px',
        top: '-8px',
        ...(iconButtonProps?.sx ?? {}),
    };

    return (
        <Box display='relative'>
            <IconButton
                arra-label='close'
                onClick={onClose}
                {...iconButtonProps}
                display='absolute'
            >
                <CloseIcon m='auto' sx={{ color: grey[500] }} fontSize='small' />
            </IconButton>
        </Box>
    );
}
