import { Stack } from '@mui/material';
import { ReactNode } from 'react';
import CloseButton from './CloseButton';

interface ModalTitleProps {
    onClose?: () => void;
    children: ReactNode;
}

export default function ModalTitle({ onClose, children }: ModalTitleProps) {
    return (
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' rowGap={1}>
            {children}
            <CloseButton onClose={onClose} />
        </Stack>
    );
}
