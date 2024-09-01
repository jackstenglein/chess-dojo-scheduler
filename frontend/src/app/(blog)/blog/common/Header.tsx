import { Divider, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import { ReactNode } from 'react';

interface HeaderProps {
    title: ReactNode;
    subtitle: ReactNode;
    image?: string;
    hideDivider?: boolean;
}

export const Header = ({ title, subtitle, image, hideDivider }: HeaderProps) => {
    return (
        <>
            <Stack mb={3}>
                <Typography variant='h4'>{title}</Typography>
                <Typography variant='h6' color='text.secondary' sx={{ mb: 1 }}>
                    {subtitle}
                </Typography>

                {!hideDivider && <Divider />}
            </Stack>

            {image && (
                <Image
                    src={image}
                    alt=''
                    style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    priority
                />
            )}
        </>
    );
};
