import { Divider, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface HeaderProps {
    title: ReactNode;
    subtitle: ReactNode;
}

export const Header = ({ title, subtitle }: HeaderProps) => {
    return (
        <Stack mb={3}>
            <Typography variant='h4'>{title}</Typography>
            <Typography variant='h6' color='text.secondary' sx={{ mb: 1 }}>
                {subtitle}
            </Typography>
            <Divider />
        </Stack>
    );
};
